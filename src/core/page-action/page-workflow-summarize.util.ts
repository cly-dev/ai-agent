import type { AIMessage } from '@langchain/core/messages';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import {
  extractAiMessageContentChannel,
  resolveLlmUserFacingTextFromAiMessage,
} from '../llm/llm-user-facing-text.util';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { SummarizeNodeInput } from '../workflow/workflow-node-input.types';
import {
  PAGE_ACTION_SUMMARIZE_STREAM_REASON,
  buildPageActionStreamId,
} from './page-action.constants';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import {
  buildLlmOutputStepAudit,
  buildLlmStepAudit,
  summarizeTextForAudit,
} from './page-action-run-audit.util';
import { logWorkflowDebug } from '../workflow/trace/workflow-debug.util';
import { executePageActionLlmDslStream } from './page-action-llm-dsl-stream.util';
import type { ResolvedPageActionSummarizeHostTool } from './page-action-summarize-host-tool.util';

export type PageWorkflowSummarizeStreamLifecycle = 'terminal' | 'none';

export type PageWorkflowSummarizeResult = {
  summaryText: string;
  dslOutcome: 'dispatched' | 'failed' | 'skipped' | null;
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

function shouldPageSummarizeUseLlmStream(input: {
  nodeInput: SummarizeNodeInput;
  streamLifecycle: PageWorkflowSummarizeStreamLifecycle;
}): boolean {
  if (input.nodeInput.stream === false) {
    return false;
  }
  if (input.streamLifecycle === 'none') {
    return false;
  }
  const mode = input.nodeInput.mode ?? 'final';
  if (mode === 'draft') {
    return false;
  }
  return true;
}

async function executePageWorkflowSummarizeInvoke(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  stepRecorder?: PageActionRunStepRecorder;
  mode: SummarizeNodeInput['mode'];
  systemPrompt?: string | null;
  objectivePrefix?: string | null;
  nodeObjective?: string | null;
}): Promise<{
  summaryText: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  assistantText: string;
}> {
  const recorder = input.stepRecorder;
  recorder?.recordLlm('summarize.start', {
    messageCount: input.messages.length,
    mode: input.mode ?? 'final',
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
  const assistantText = extractAiMessageContentChannel(aiMessage);
  const summaryText = resolveLlmUserFacingTextFromAiMessage(aiMessage);
  const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
  const resolvedModel = resolveLlmModelNameFromResponseMeta(responseMeta);

  recorder?.recordLlm('summarize.end', {
    summaryTextLength: summaryText.length,
    summaryText: summarizeTextForAudit(summaryText, 4000),
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    fittedMessageCount: fittedMessages.length,
    delivery: 'invoke',
    ...buildLlmOutputStepAudit({
      assistantText,
      userFacingText: summaryText,
    }),
  });

  return {
    summaryText,
    model: resolvedModel,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    assistantText,
  };
}

export async function executePageWorkflowSummarize(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  nodeInput: SummarizeNodeInput;
  sseSink: PageActionSseSink;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  existingFillText: string;
  pageContext: AgentChatPageContext | null;
  summarizeHostTool: ResolvedPageActionSummarizeHostTool;
  stepRecorder?: PageActionRunStepRecorder;
  /** terminal：终态 summarize；none：中间步（present_mutation 等，不推 DSL） */
  streamLifecycle?: PageWorkflowSummarizeStreamLifecycle;
  /** host_action DSL streamId 分段（如 workflow nodeId） */
  streamIdSegment?: string | null;
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
    segment: input.streamIdSegment,
  });

  const useLlmStream = shouldPageSummarizeUseLlmStream({
    nodeInput: input.nodeInput,
    streamLifecycle,
  });

  if (useLlmStream) {
    recorder?.recordLlm('summarize.start', {
      messageCount: input.messages.length,
      mode,
      delivery: 'dsl_stream',
      builtinHostTool: input.summarizeHostTool.builtin,
      hostToolName: input.summarizeHostTool.hostTool.definition.name,
      ...buildLlmStepAudit({
        systemPrompt: input.systemPrompt,
        objectivePrefix: input.objectivePrefix,
        nodeObjective: input.nodeObjective,
        promptMessages: input.messages,
      }),
    });

    const streamResult = await executePageActionLlmDslStream({
      llmService: input.llmService,
      messages: input.messages,
      sseSink: input.sseSink,
      pageContext: input.pageContext,
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      generation: input.generation,
      streamId,
      hostTool: input.summarizeHostTool.hostTool,
      reason: PAGE_ACTION_SUMMARIZE_STREAM_REASON,
      stepRecorder: recorder,
      budgetHints: { callKind: 'summarize' },
      llmAudit: { startName: 'summarize.stream.start', endName: 'summarize.stream.end' },
    });

    const summaryText = streamResult.fillText;

    recorder?.recordLlm('summarize.end', {
      summaryTextLength: summaryText.length,
      summaryText: summarizeTextForAudit(summaryText, 4000),
      model: streamResult.model,
      promptTokens: streamResult.promptTokens,
      completionTokens: streamResult.completionTokens,
      delivery: 'dsl_stream',
      dslOutcome: streamResult.dslOutcome,
      appendCount: streamResult.appendCount,
    });

    logWorkflowDebug('page_summarize', {
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      mode,
      delivery: 'dsl_stream',
      summaryTextLength: summaryText.length,
      dslOutcome: streamResult.dslOutcome,
    });

    return {
      summaryText,
      dslOutcome: streamResult.dslOutcome,
      model: streamResult.model,
      promptTokens: streamResult.promptTokens,
      completionTokens: streamResult.completionTokens,
      emittedLifecycle: false,
    };
  }

  const invoked = await executePageWorkflowSummarizeInvoke({
    llmService: input.llmService,
    messages: input.messages,
    stepRecorder: recorder,
    mode,
    systemPrompt: input.systemPrompt,
    objectivePrefix: input.objectivePrefix,
    nodeObjective: input.nodeObjective,
  });

  logWorkflowDebug('page_summarize', {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    mode,
    delivery: 'invoke',
    summaryTextLength: invoked.summaryText.length,
  });

  return {
    summaryText: invoked.summaryText,
    dslOutcome: null,
    model: invoked.model,
    promptTokens: invoked.promptTokens,
    completionTokens: invoked.completionTokens,
    emittedLifecycle: false,
  };
}
