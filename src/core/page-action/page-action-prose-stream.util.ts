import {
  createSummarizeProseStreamSession,
  finalizeSummarizeProseStreamAfterLlm,
} from '../agent-engine/engine/summarize-prose-stream.util';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { PromptBudgetHints } from '../llm/prompt-budget/prompt-budget.types';
import {
  buildLlmOutputStepAudit,
  summarizeTextForAudit,
} from './page-action-run-audit.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import {
  writePageActionStreamDelta,
  type PageActionLifecyclePayload,
} from './page-action-inline-sse.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
import {
  logPageActionLlmPrompt,
  logPageActionLlmResponse,
} from './page-action-run-debug.util';

export type PageActionProseStreamResult = {
  summaryText: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  deltaCount: number;
};

function responseMetaFromStreamRaw(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const responseMeta = row.response_metadata;
  if (responseMeta && typeof responseMeta === 'object' && !Array.isArray(responseMeta)) {
    return responseMeta as Record<string, unknown>;
  }
  return row;
}

type PageActionStreamLifecycle = Pick<
  PageActionLifecyclePayload,
  | 'actionRunId'
  | 'actionKey'
  | 'delivery'
  | 'generation'
  | 'streamId'
  | 'clientActionId'
>;

/**
 * 幂等重放 / 迟订阅：将已定稿 prose 拆成 stream delta（与 live 流同事件形态）。
 */
export function replayPageActionProseStream(input: {
  sseSink: PageActionSseSink;
  fillText: string;
  lifecycle: PageActionStreamLifecycle;
}): number {
  const prose = input.fillText.trim();
  if (!prose || input.sseSink.writableEnded) {
    return 0;
  }
  let deltaCount = 0;
  const proseSession = createSummarizeProseStreamSession({
    onProseDelta: (delta) => {
      if (!delta || input.sseSink.writableEnded) {
        return;
      }
      deltaCount += 1;
      writePageActionStreamDelta(input.sseSink, {
        ...input.lifecycle,
        text: delta,
      });
    },
  });
  proseSession.replayRoutedMessage(prose);
  return deltaCount;
}

/**
 * PageAction 总结 / 分析 prose 流：直出 page_action SSE，不经 host_action DSL。
 */
export async function executePageActionProseStream(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  sseSink: PageActionSseSink;
  actionRunId: number;
  actionKey: string;
  generation: number;
  streamId: string;
  clientActionId?: string | null;
  stepRecorder?: PageActionRunStepRecorder;
  budgetHints?: PromptBudgetHints;
  signal?: AbortSignal;
  llmAudit?: {
    startName?: string;
    endName?: string;
    /** 合并进 summarize.start（如 buildLlmStepAudit） */
    startDetail?: Record<string, unknown>;
  };
}): Promise<PageActionProseStreamResult> {
  const recorder = input.stepRecorder;
  const startName = input.llmAudit?.startName ?? 'summarize.start';
  const endName = input.llmAudit?.endName ?? 'summarize.end';
  let deltaCount = 0;
  let streamedRaw = '';

  const lifecycle: PageActionStreamLifecycle = {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    delivery: 'inline_stream',
    generation: input.generation,
    streamId: input.streamId,
    clientActionId: input.clientActionId ?? null,
  };

  const proseSession = createSummarizeProseStreamSession({
    onProseDelta: (delta) => {
      if (!delta || input.sseSink.writableEnded) {
        return;
      }
      deltaCount += 1;
      writePageActionStreamDelta(input.sseSink, {
        ...lifecycle,
        text: delta,
      });
    },
  });

  recorder?.recordLlm(startName, {
    messageCount: input.messages.length,
    delivery: 'prose_stream',
    producePath: 'page_action_delta',
    ...input.llmAudit?.startDetail,
  });

  logPageActionLlmPrompt({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    phase: 'prose_stream',
    messages: input.messages,
    meta: { streamId: input.streamId },
  });

  if (input.signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  const streamResult = await input.llmService.streamChat(
    {
      messages: input.messages,
      tools: [],
      signal: input.signal,
      budgetHints: input.budgetHints ?? { callKind: 'summarize' },
    },
    {
      signal: input.signal,
      onDelta: (delta) => {
        // PageAction 无 think 展示通道：reasoningDelta（thinking 模型思考）直接丢弃，
        // 只有 contentDelta 进 prose；防止思考过程流给前端（qwen3.x-plus 场景）。
        if (!delta.contentDelta) {
          return;
        }
        streamedRaw += delta.contentDelta;
        proseSession.ingestLlmDelta(delta.contentDelta);
      },
    },
  );

  const responseMeta = responseMetaFromStreamRaw(streamResult.raw);
  const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
  const model =
    streamResult.model ??
    resolveLlmModelNameFromResponseMeta(responseMeta) ??
    null;

  const rawStreamedText = streamedRaw.trim();
  const rawResultText = (streamResult.content ?? '').trim();
  const finalized = finalizeSummarizeProseStreamAfterLlm({
    session: proseSession,
    rawStreamedText,
    rawResultText,
  });
  const summaryText = finalized.userMarkdown;

  recorder?.recordLlm(endName, {
    summaryTextLength: summaryText.length,
    summaryText: summarizeTextForAudit(summaryText, 4000),
    model,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    delivery: 'prose_stream',
    deltaCount,
    ...buildLlmOutputStepAudit({
      assistantText: rawResultText || rawStreamedText,
      userFacingText: summaryText,
    }),
  });

  logPageActionLlmResponse({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    phase: 'prose_stream',
    model,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    detail: { deltaCount, summaryTextLength: summaryText.length },
  });

  return {
    summaryText,
    model,
    promptTokens: usage?.promptTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    deltaCount,
  };
}
