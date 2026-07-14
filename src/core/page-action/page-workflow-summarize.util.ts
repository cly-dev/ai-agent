import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { SummarizeNodeInput } from '../workflow/workflow-node-input.types';
import { buildPageActionStreamId } from './page-action.constants';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import {
  buildLlmOutputStepAudit,
  buildLlmStepAudit,
  summarizeTextForAudit,
} from './page-action-run-audit.util';
import { logWorkflowDebug } from '../workflow/trace/workflow-debug.util';
import { executePageActionProseStream } from './page-action-prose-stream.util';
import type { AIMessage } from '@langchain/core/messages';
import {
  extractAiMessageContentChannel,
  resolveLlmUserFacingTextFromAiMessage,
} from '../llm/llm-user-facing-text.util';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';

export type PageWorkflowSummarizeStreamLifecycle = 'terminal' | 'none';

export type PageWorkflowSummarizeResult = {
  summaryText: string;
  /** 总结 prose 流不走 host_action；恒为 null。 */
  dslOutcome: null;
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
  stepRecorder?: PageActionRunStepRecorder;
  /** terminal：终态 summarize；none：中间步（present_mutation 等，不推流） */
  streamLifecycle?: PageWorkflowSummarizeStreamLifecycle;
  streamIdSegment?: string | null;
  systemPrompt?: string | null;
  objectivePrefix?: string | null;
  nodeObjective?: string | null;
  signal?: AbortSignal;
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
    const streamResult = await executePageActionProseStream({
      llmService: input.llmService,
      messages: input.messages,
      sseSink: input.sseSink,
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      generation: input.generation,
      streamId,
      clientActionId: input.clientActionId,
      stepRecorder: recorder,
      signal: input.signal,
      budgetHints: { callKind: 'summarize' },
      llmAudit: {
        startName: 'summarize.start',
        endName: 'summarize.end',
        startDetail: {
          mode,
          ...buildLlmStepAudit({
            systemPrompt: input.systemPrompt,
            objectivePrefix: input.objectivePrefix,
            nodeObjective: input.nodeObjective,
            promptMessages: input.messages,
          }),
        },
      },
    });

    logWorkflowDebug('page_summarize', {
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      mode,
      delivery: 'prose_stream',
      summaryTextLength: streamResult.summaryText.length,
    });

    return {
      summaryText: streamResult.summaryText,
      dslOutcome: null,
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
