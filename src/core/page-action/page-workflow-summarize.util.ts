import type { AIMessage } from '@langchain/core/messages';
import type { Response } from 'express';
import { extractAiMessageText } from '../agent-engine/engine/main/agent-graph/runtime/decision.util';
import { extractLlmUserFacingText } from '../agent-engine/engine/llm-output-sanitize.util';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { SummarizeNodeInput } from '../workflow/workflow-node-input.types';
import { buildPageActionStreamId } from './page-action.constants';
import {
  endInlineSseResponse,
  writePageActionLifecycle,
} from './page-action-inline-sse.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import {
  buildLlmOutputStepAudit,
  buildLlmStepAudit,
  summarizeTextForAudit,
} from './page-action-run-audit.util';
import { logWorkflowDebug } from '../workflow/trace/workflow-debug.util';

export type PageWorkflowSummarizeStreamLifecycle = 'terminal' | 'none';

export type PageWorkflowSummarizeResult = {
  summaryText: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  emittedLifecycle: boolean;
};

export function shouldEmitPageSummarizeLifecycle(input: {
  mode: SummarizeNodeInput['mode'];
  existingFillText: string;
  summaryText: string;
  responseWritable: boolean;
}): boolean {
  const mode = input.mode ?? 'final';
  return (
    mode !== 'draft' &&
    !input.existingFillText.trim() &&
    input.summaryText.trim().length > 0 &&
    input.responseWritable
  );
}

export async function executePageWorkflowSummarize(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  nodeInput: SummarizeNodeInput;
  res: Response;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  existingFillText: string;
  stepRecorder?: PageActionRunStepRecorder;
  /** terminal：终态 summarize，发 lifecycle 并关闭 SSE；none：仅 LLM（present_mutation 等中间步） */
  streamLifecycle?: PageWorkflowSummarizeStreamLifecycle;
  systemPrompt?: string | null;
  objectivePrefix?: string | null;
  nodeObjective?: string | null;
}): Promise<PageWorkflowSummarizeResult> {
  const recorder = input.stepRecorder;
  const mode = input.nodeInput.mode ?? 'final';
  const streamLifecycle = input.streamLifecycle ?? 'terminal';
  const streamId = buildPageActionStreamId({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
  });
  const lifecycleBase = {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    delivery: 'inline_stream' as const,
    generation: input.generation,
    streamId,
    clientActionId: input.clientActionId ?? null,
  };

  recorder?.recordLlm('summarize.start', {
    messageCount: input.messages.length,
    mode,
    ...buildLlmStepAudit({
      systemPrompt: input.systemPrompt,
      objectivePrefix: input.objectivePrefix,
      nodeObjective: input.nodeObjective,
      promptMessages: input.messages,
    }),
  });

  const { model, messages: fittedMessages } =
    await input.llmService.createLangChainChatModelForMessages(input.messages, {
      budgetHints: { callKind: 'summarize' },
    });
  const aiMessage = (await model.invoke(fittedMessages)) as AIMessage;
  const responseMeta = aiMessage.response_metadata as
    | Record<string, unknown>
    | undefined;
  const assistantText = extractAiMessageText(aiMessage);
  const summaryText = extractLlmUserFacingText(assistantText);
  const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
  const resolvedModel = resolveLlmModelNameFromResponseMeta(responseMeta);

  recorder?.recordLlm('summarize.end', {
    summaryTextLength: summaryText.length,
    summaryText: summarizeTextForAudit(summaryText, 4000),
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    fittedMessageCount: fittedMessages.length,
    ...buildLlmOutputStepAudit({
      assistantText,
      userFacingText: summaryText,
    }),
  });

  const shouldEmitTerminal =
    streamLifecycle === 'terminal' &&
    shouldEmitPageSummarizeLifecycle({
      mode,
      existingFillText: input.existingFillText,
      summaryText,
      responseWritable: !input.res.writableEnded,
    });

  if (shouldEmitTerminal) {
    writePageActionLifecycle(
      input.res,
      { phase: 'started', ...lifecycleBase },
      recorder,
    );
    writePageActionLifecycle(
      input.res,
      {
        phase: 'completed',
        ...lifecycleBase,
        text: summaryText,
        dslOutcome: null,
      },
      recorder,
    );
    endInlineSseResponse(input.res);
  }

  logWorkflowDebug('page_summarize', {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    mode,
    summaryTextLength: summaryText.length,
    emittedLifecycle: shouldEmitTerminal,
  });

  return {
    summaryText,
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    emittedLifecycle: shouldEmitTerminal,
  };
}
