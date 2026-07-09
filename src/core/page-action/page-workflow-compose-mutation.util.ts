import type { AIMessage } from '@langchain/core/messages';
import {
  extractToolCalls,
} from '../agent-engine/engine/main/agent-graph/runtime/decision.util';
import {
  prepareComposeWriteToolCall,
} from '../agent-engine/engine/main/plan-present/plan-compose-write.util';
import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import { findMissingRequiredWriteToolArgPath } from '../tool-engine/write-tool-draft-injection.util';
import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
import {
  appendWorkflowNodeOutputsToMessages,
  injectWorkflowNodeObjective,
} from './page-workflow-messages.util';
import { mergePageWorkflowLlmMetrics } from './page-workflow-node.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import {
  buildLlmOutputStepAudit,
  buildLlmStepAudit,
  summarizeRecordForAudit,
} from './page-action-run-audit.util';
import {
  extractAiMessageContentChannel,
  resolveLlmUserFacingTextFromAiMessage,
} from '../llm/llm-user-facing-text.util';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';

export type PageWorkflowComposeMutationResult = {
  arguments: Record<string, unknown>;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
};

function collectReadObservationsFromNodeOutputs(
  nodeOutputs: Record<string, unknown>,
): ToolObservation[] {
  const observations: ToolObservation[] = [];
  for (const value of Object.values(nodeOutputs)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }
    const row = value as Record<string, unknown>;
    const toolName =
      typeof row.toolName === 'string' ? row.toolName.trim() : '';
    if (!toolName || !('output' in row)) {
      continue;
    }
    observations.push({
      name: toolName,
      output: row.output,
      quality: 'high',
    });
  }
  return observations;
}

/**
 * Page workflow compose_mutation：LLM 产写工具参数（与 Chat ReAct compose 语义对齐），
 * 再经 read observations + pageContext 机器层补齐。
 */
export async function executePageWorkflowComposeMutation(input: {
  runtime: PageWorkflowExecutorRuntime;
  def: WorkflowNodeDef;
  writeToolId: number;
  allowedToolIds: number[];
  stepRecorder?: PageActionRunStepRecorder;
}): Promise<PageWorkflowComposeMutationResult> {
  const { runtime } = input;
  const recorder = input.stepRecorder ?? runtime.stepRecorder;
  const toolBundle = runtime.toolBundle;
  if (!toolBundle) {
    throw new Error('Page workflow tool bundle is not initialized');
  }

  const scopedTools = toolBundle.engineTools;
  const toolBuildCtx = toolBundle.toolBuildCtx;
  const writeTool = scopedTools.find((row) => row.id === input.writeToolId);
  if (!writeTool) {
    throw new Error(`Write tool id=${input.writeToolId} not in allowed tools`);
  }

  const writeLangChainTools = runtime.toolEngine.buildLangChainTools(
    scopedTools.filter((row) => row.id === input.writeToolId),
    toolBuildCtx,
  );

  const messages = injectWorkflowNodeObjective(
    appendWorkflowNodeOutputsToMessages(runtime.messages, runtime.nodeOutputs),
    input.def.objective,
    runtime.objectivePrefix,
  );
  messages.push({
    role: 'user',
    content: [
      `Produce write parameters by calling tool \`${writeTool.name}\` exactly once.`,
      'Do not execute HTTP — only emit tool_call arguments for later user confirmation.',
    ].join(' '),
  });

  recorder.recordLlm('compose_mutation.start', {
    writeToolId: writeTool.id,
    writeToolName: writeTool.name,
    messageCount: messages.length,
    ...buildLlmStepAudit({
      systemPrompt: runtime.systemPrompt,
      objectivePrefix: runtime.objectivePrefix,
      nodeObjective: input.def.objective,
      promptMessages: messages,
    }),
  });

  const { model, messages: fittedMessages } =
    await runtime.llmService.createLangChainChatModelForMessages(messages, {
      budgetHints: { callKind: 'decision' },
    });
  const bound = model.bindTools(writeLangChainTools.tools);
  const aiMessage = (await bound.invoke(fittedMessages)) as AIMessage;
  const responseMeta = aiMessage.response_metadata as
    | Record<string, unknown>
    | undefined;
  const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
  const resolvedModel = resolveLlmModelNameFromResponseMeta(responseMeta);
  const assistantText = extractAiMessageContentChannel(aiMessage);

  const toolCalls = extractToolCalls(aiMessage);
  const rawCall = toolCalls.find((call) => call.name === writeTool.name);
  if (!rawCall) {
    throw new Error(
      `LLM did not emit tool_call for write tool ${writeTool.name}`,
    );
  }

  const observations = collectReadObservationsFromNodeOutputs(
    runtime.nodeOutputs,
  );
  const prepared = prepareComposeWriteToolCall({
    toolCall: rawCall,
    writeTool,
    observations,
    scopedTools,
    pageContext: runtime.pageContext,
  });

  const missingPath = findMissingRequiredWriteToolArgPath(
    prepared.arguments,
    writeTool,
  );
  if (missingPath) {
    throw new Error(
      `Composed write arguments missing required field: ${missingPath}`,
    );
  }

  mergePageWorkflowLlmMetrics(runtime.metrics, {
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
  });

  recorder.recordLlm('compose_mutation.end', {
    writeToolName: writeTool.name,
    writeToolId: writeTool.id,
    argumentKeys: Object.keys(prepared.arguments),
    writeArguments: summarizeRecordForAudit(prepared.arguments),
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    fittedMessageCount: fittedMessages.length,
    ...buildLlmOutputStepAudit({
      assistantText,
      userFacingText: resolveLlmUserFacingTextFromAiMessage(aiMessage),
      toolCall: {
        name: rawCall.name,
        arguments: rawCall.arguments,
      },
      structuredOutput: prepared.arguments,
    }),
  });

  return {
    arguments: prepared.arguments,
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
  };
}
