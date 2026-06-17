import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ChatEventsService } from '../../../../modules/chat/chat-events.service';
import type { AgentMachineCode } from '../agent-run-user-messages.util';
import type { MessageBlock, MessageBlockPatch } from '../message/message-blocks.types';
import {
  filterLlmBlocksAvoidDuplicatingRule,
  looksLikeBlocksJsonOutput,
  createSummarizeMessageStreamState,
  processSummarizeMessageStreamChunk,
  mergeStreamedDeltaTextForStorage,
  mergeSummarizeBlocksForStorage,
  nextSanitizedSummarizeStreamDelta,
  normalizeMessageBlocks,
  planStructuredBlockStreaming,
  sanitizeMessageBlocks,
  serializeMessageBlocksForStorage,
  summarizeStreamedProseFromState,
  textBlock,
  tryParseLlmBlocksFromSummarizeOutput,
  type SummarizeMessageStreamState,
} from '../message/message-blocks.util';
import type { LlmChatMessage } from '../../../llm/llm.types';
import { LlmService } from '../../../llm/llm.service';
import { emitLlmPromptDebug } from '../llm-prompt-debug.util';
import { sanitizeLlmFinalOutput } from '../llm-output-sanitize.util';
import {
  createLlmStreamRouterState,
  extractRoutedMessageFromLlmText,
  routeLlmStreamChunk,
} from '../llm-stream-router.util';
import {
  RunAssistantArtifactStore,
  type RunAssistantArtifactPhase,
} from './run-assistant-artifact.store';
import {
  emitAgentMessagePersistDebug,
  emitAgentMessageSseDebug,
} from '../message/message-blocks-debug.util';

@Injectable()
export class AgentRunSseEmitter {
  private readonly logger = new Logger(AgentRunSseEmitter.name);
  /** SSE result 流式序号；key = sessionId:runId */
  private readonly streamSeq = new Map<string, number>();
  /** 本 run 已推送过 message 流式增量（key = sessionId:runId） */
  private readonly messageStreamDeltaEmitted = new Set<string>();
  /** 本 run 经 delta 推送的正文累积（用于与 artifact 定稿对比） */
  private readonly streamedProseAccumulator = new Map<string, string>();

  constructor(
    private readonly chatEvents: ChatEventsService,
    private readonly llmService: LlmService,
    private readonly assistantArtifact: RunAssistantArtifactStore,
  ) {}

  thinkBufferKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  clearThinkBuffer(sessionId: string, runId: number): void {
    const key = this.thinkBufferKey(sessionId, runId);
    this.streamSeq.delete(key);
    this.messageStreamDeltaEmitted.delete(key);
    this.streamedProseAccumulator.delete(key);
  }

  /** run 收尾前推送与 artifact / 落库一致的权威 full（`complete` 前必达）。 */
  emitRunMessageBlocksIfNeeded(
    sessionId: string,
    runId: number,
    turnId: number,
  ): void {
    const toEmit = this.assistantArtifact.peekBlocks(sessionId, runId);
    if (toEmit.length === 0) {
      return;
    }
    const turnIdResolved =
      turnId ??
      this.assistantArtifact.peekTurnId(sessionId, runId) ??
      undefined;
    this.emitMessageBlocks(sessionId, runId, toEmit, {
      action: 'stream',
      mode: 'full',
      turnId: turnIdResolved,
      debugSource: {
        origin: 'emitRunMessageBlocksIfNeeded',
        artifactBlocks: toEmit,
        artifactSerialized: serializeMessageBlocksForStorage(toEmit),
      },
    });
  }

  /** 仅规则化 blocks（alert/metric 等）：loading → patch → 权威 full，不调 LLM。 */
  publishRuleBlocksOnly(
    sessionId: string,
    runId: number,
    blocks: MessageBlock[],
    turnId?: number,
  ): MessageBlock[] {
    const sanitized = sanitizeMessageBlocks(blocks);
    if (sanitized.length === 0) {
      return [];
    }
    const turnIdResolved =
      turnId ??
      this.assistantArtifact.peekTurnId(sessionId, runId) ??
      undefined;
    const { placeholders, patches } = planStructuredBlockStreaming(
      runId,
      sanitized,
    );
    for (const placeholder of placeholders) {
      this.emitMessageBlocks(sessionId, runId, [placeholder], {
        action: 'stream',
        mode: 'full',
        turnId: turnIdResolved,
      });
    }
    for (const patch of patches) {
      this.emitBlockPatch(sessionId, runId, patch);
    }
    return this.publishAssistantBlocks(sessionId, runId, sanitized, {
      turnId: turnIdResolved,
    });
  }

  emitThink(
    sessionId: string,
    runId: number | undefined,
    chunk: string,
    mode: 'delta' | 'replace' = 'delta',
  ): void {
    if (!chunk) {
      return;
    }
    this.chatEvents.emit(sessionId, {
      event: 'think',
      payload: { content: chunk, mode },
    });
  }

  emitMessageBlocks(
    sessionId: string,
    runId: number | undefined,
    blocks: MessageBlock[],
    options?: {
      code?: AgentMachineCode;
      mode?: 'delta' | 'full';
      action?: 'stream';
      turnId?: number;
      debugSource?: Record<string, unknown>;
    },
  ): void {
    const action = options?.action ?? 'stream';
    const mode = options?.mode ?? 'full';
    const normalized =
      mode === 'full'
        ? sanitizeMessageBlocks(blocks)
        : normalizeMessageBlocks(blocks);
    if (normalized.length === 0) {
      return;
    }
    const key = runId == null ? null : this.thinkBufferKey(sessionId, runId);
    if (key && action === 'stream' && mode === 'delta') {
      this.messageStreamDeltaEmitted.add(key);
      const deltaPlain = normalized
        .filter((block): block is Extract<MessageBlock, { type: 'text' }> =>
          block.type === 'text',
        )
        .map((block) => block.content)
        .join('');
      if (deltaPlain) {
        this.streamedProseAccumulator.set(
          key,
          (this.streamedProseAccumulator.get(key) ?? '') + deltaPlain,
        );
      }
    }
    const nextSeq = key ? (this.streamSeq.get(key) ?? 0) + 1 : undefined;
    if (key && nextSeq != null) {
      this.streamSeq.set(key, nextSeq);
    }
    const payload = {
      source: 'agent-run' as const,
      action,
      runId,
      turnId: options?.turnId,
      blocks: normalized,
      code: options?.code,
      seq: nextSeq,
      mode,
    };
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload,
    });
    if (runId != null) {
      const artifact = this.assistantArtifact.peek(sessionId, runId);
      emitAgentMessageSseDebug({
        tag: `emitMessageBlocks:${action}:${mode}`,
        sessionId,
        runId,
        turnId: options?.turnId,
        ssePayload: payload,
        source: {
          ...(options?.debugSource ?? {}),
          inputBlocks: blocks,
          normalizedBlocks: normalized,
          storageSerialized:
            mode === 'full'
              ? serializeMessageBlocksForStorage(normalized)
              : undefined,
          artifactSlot: artifact
            ? {
                phase: artifact.phase,
                blocks: artifact.blocks,
                serialized: artifact.serialized,
              }
            : null,
        },
      });
    }
  }

  emitBlockPatch(
    sessionId: string,
    runId: number,
    patch: MessageBlockPatch,
  ): void {
    const block = normalizeMessageBlocks([patch.block])[0];
    if (!block || block.type === 'loading') {
      return;
    }
    const key = this.thinkBufferKey(sessionId, runId);
    const nextSeq = (this.streamSeq.get(key) ?? 0) + 1;
    this.streamSeq.set(key, nextSeq);
    const payload = {
      source: 'agent-run' as const,
      action: 'patch' as const,
      runId,
      patches: [{ replaceId: patch.replaceId, block }],
      seq: nextSeq,
    };
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload,
    });
    emitAgentMessageSseDebug({
      tag: 'emitBlockPatch',
      sessionId,
      runId,
      ssePayload: payload,
      source: {
        inputPatch: patch,
        normalizedBlock: block,
      },
    });
  }

  async streamRunnableMessages(
    runnable: {
      stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
      invoke: (messages: unknown[]) => Promise<AIMessage>;
    },
    messages: Array<Record<string, string>>,
    sessionId: string,
    runId: number,
  ): Promise<AIMessage> {
    let merged: AIMessageChunk | undefined;
    let streamedText = '';
    try {
      const stream = await runnable.stream(messages);
      for await (const chunk of stream) {
        const row = chunk as AIMessageChunk;
        const delta = this.extractAiMessageText(row as AIMessage);
        if (delta) {
          streamedText += delta;
          // 决策环：模型输出（含思考标签）仅走 think 增量，最终用户回复由 summarize 推送 message
          this.emitThink(sessionId, runId, delta, 'delta');
        }
        merged = merged ? merged.concat(row) : row;
      }
    } catch (error) {
      this.logger.warn(
        `llm stream fallback to invoke sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const aiMessage = await runnable.invoke(messages);
      const text = this.extractAiMessageText(aiMessage).trim();
      if (text) {
        this.emitThink(sessionId, runId, text, 'delta');
      }
      return aiMessage;
    }
    if (merged) {
      const aiMessage = new AIMessage({
        content: merged.content,
        tool_calls: merged.tool_calls,
        additional_kwargs: merged.additional_kwargs,
        response_metadata: merged.response_metadata,
      });
      const text = this.extractAiMessageText(aiMessage).trim();
      if (text && !streamedText) {
        this.emitThink(sessionId, runId, text, 'delta');
      }
      return aiMessage;
    }
    if (streamedText) {
      return new AIMessage({ content: streamedText });
    }
    return new AIMessage({ content: '' });
  }

  async streamSummarizeMessageBlocks(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    fallbackPlainText: string,
  ): Promise<{ blocks: MessageBlock[]; rawOutput: string }> {
    const runKey = this.thinkBufferKey(sessionId, runId);
    const turnId =
      this.assistantArtifact.peekTurnId(sessionId, runId) ?? undefined;
    const summarizeDebugFile = emitLlmPromptDebug(
      (message) => this.logger.log(message),
      {
        runId,
        sessionId,
        phase: 'summarize',
        messages,
        meta: { ruleBlockCount: ruleBlocks.length },
      },
    );
    if (summarizeDebugFile) {
      this.logger.log(
        `LLM summarize prompt file runId=${runId} path=${summarizeDebugFile}`,
      );
    }
    const { placeholders, patches } = planStructuredBlockStreaming(
      runId,
      ruleBlocks,
    );
    for (const placeholder of placeholders) {
      this.emitMessageBlocks(sessionId, runId, [placeholder], {
        action: 'stream',
        mode: 'full',
        turnId,
      });
    }

    let summarizeStreamState: SummarizeMessageStreamState =
      createSummarizeMessageStreamState();
    let sanitizedEmitted = '';
    const emitSummarizeProseProgress = (
      state: SummarizeMessageStreamState,
    ): void => {
      const proseSnapshot = summarizeStreamedProseFromState(state);
      if (!proseSnapshot) {
        return;
      }
      const next = nextSanitizedSummarizeStreamDelta(
        proseSnapshot,
        sanitizedEmitted,
      );
      sanitizedEmitted = next.emitted;
      if (!next.delta) {
        return;
      }
      this.emitMessageBlocks(sessionId, runId, [textBlock(next.delta)], {
        mode: 'delta',
        action: 'stream',
        turnId,
      });
    };

    let streamed = '';
    let streamRouter = createLlmStreamRouterState();
    const result = await this.llmService.streamChat(
      {
        messages,
        tools: [],
      },
      {
        onDelta: (delta) => {
          if (!delta.contentDelta) {
            return;
          }
          streamed += delta.contentDelta;
          const routed = routeLlmStreamChunk(streamRouter, delta.contentDelta);
          streamRouter = routed.state;
          if (routed.think) {
            this.emitThink(sessionId, runId, routed.think, 'delta');
          }
          if (!routed.message) {
            return;
          }
          const processed = processSummarizeMessageStreamChunk(
            summarizeStreamState,
            routed.message,
          );
          summarizeStreamState = processed.state;
          if (processed.delta) {
            emitSummarizeProseProgress(summarizeStreamState);
          }
        },
      },
    );
    const rawStreamedText = streamed.trim();
    const rawResultText = (result.content ?? '').trim();
    const rawLlmSource = rawStreamedText || rawResultText;
    const routedMessage = rawLlmSource
      ? extractRoutedMessageFromLlmText(rawLlmSource)
      : '';

    if (!this.messageStreamDeltaEmitted.has(runKey) && routedMessage) {
      const streamMeta = result.streamMeta;
      const replayReason = streamMeta?.fellBackToInvoke
        ? 'invoke_fallback'
        : 'buffer_or_json_no_delta';
      if (streamMeta?.fellBackToInvoke) {
        this.logger.warn(
          `summarize stream fallback to invoke runId=${runId} model=${result.model}`,
        );
      } else {
        this.logger.warn(
          `summarize stream replay deltas reason=${replayReason} runId=${runId} model=${result.model}`,
        );
      }
      let replayState = createSummarizeMessageStreamState();
      for (const ch of routedMessage) {
        const processed = processSummarizeMessageStreamChunk(replayState, ch);
        replayState = processed.state;
        if (processed.delta) {
          emitSummarizeProseProgress(replayState);
        }
      }
      summarizeStreamState = replayState;
    } else if (!rawStreamedText && rawResultText) {
      this.logger.warn(
        `summarize stream no delta runId=${runId} model=${result.model} emittedDeltaCount=${result.streamMeta?.emittedDeltaCount ?? 0}`,
      );
    }
    const parsedLlmBlocks = tryParseLlmBlocksFromSummarizeOutput(
      routedMessage || rawLlmSource,
    );
    const llmBlocksFromParse = parsedLlmBlocks
      ? sanitizeMessageBlocks(
          filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, parsedLlmBlocks),
        )
      : [];
    const proseFallbackSource =
      llmBlocksFromParse.length > 0
        ? ''
        : sanitizeLlmFinalOutput(routedMessage || rawLlmSource || fallbackPlainText);

    for (const patch of patches) {
      this.emitBlockPatch(sessionId, runId, patch);
    }

    const streamedMessageText =
      sanitizedEmitted ||
      sanitizeLlmFinalOutput(
        summarizeStreamedProseFromState(summarizeStreamState),
      );

    let llmBlocksForStorage =
      llmBlocksFromParse.length > 0
        ? llmBlocksFromParse
        : proseFallbackSource.trim() &&
            !looksLikeBlocksJsonOutput(proseFallbackSource)
          ? filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
              textBlock(proseFallbackSource, 'markdown'),
            ])
          : [];
    if (
      streamedMessageText.trim() &&
      !looksLikeBlocksJsonOutput(streamedMessageText)
    ) {
      llmBlocksForStorage = mergeStreamedDeltaTextForStorage(
        ruleBlocks,
        llmBlocksForStorage,
        streamedMessageText,
      );
    }
    const sanitizedMerged = sanitizeMessageBlocks(
      mergeSummarizeBlocksForStorage(
        ruleBlocks,
        llmBlocksForStorage,
        fallbackPlainText,
      ),
    );

    const blocks = this.publishAssistantBlocks(sessionId, runId, sanitizedMerged, {
      turnId,
    });
    const streamedProse = this.streamedProseAccumulator.get(runKey) ?? '';
    if (streamedProse.trim() && runId != null) {
      const publishedSerialized = serializeMessageBlocksForStorage(blocks);
      const deltaOnlySerialized = serializeMessageBlocksForStorage([
        textBlock(streamedProse, 'markdown'),
      ]);
      if (deltaOnlySerialized !== publishedSerialized) {
        emitAgentMessagePersistDebug({
          tag: 'SSE_DELTA_VS_PUBLISH_MISMATCH',
          sessionId,
          runId,
          turnId,
          dbContent: publishedSerialized,
          source: {
            streamedDeltaProse: streamedProse,
            publishedBlocks: blocks,
            publishedSerialized,
            deltaOnlySerialized,
          },
        });
      }
    }
    return {
      blocks,
      rawOutput: routedMessage || rawLlmSource,
    };
  }

  /**
   * 定稿交付：权威 full SSE（与 artifact / 落库一致）。
   * 正文 delta 须在 LLM stream 回调中已推送；此处不再模拟切片。
   */
  publishAssistantBlocks(
    sessionId: string,
    runId: number,
    blocks: MessageBlock[],
    options?: {
      turnId?: number;
      phase?: RunAssistantArtifactPhase;
      code?: AgentMachineCode;
      commitArtifact?: boolean;
    },
  ): MessageBlock[] {
    const sanitized = sanitizeMessageBlocks(blocks);
    if (sanitized.length === 0) {
      return [];
    }
    const turnId =
      options?.turnId ??
      this.assistantArtifact.peekTurnId(sessionId, runId) ??
      undefined;

    this.emitMessageBlocks(sessionId, runId, sanitized, {
      action: 'stream',
      mode: 'full',
      turnId,
      code: options?.code,
      debugSource: {
        origin: 'publishAssistantBlocks',
        phase: options?.phase ?? 'final',
        commitArtifact: options?.commitArtifact !== false,
        inputBlocks: blocks,
      },
    });

    if (options?.commitArtifact !== false) {
      this.assistantArtifact.commit(
        sessionId,
        runId,
        sanitized,
        options?.phase ?? 'final',
      );
    }
    return sanitized;
  }

  private extractAiMessageText(message: AIMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          item && typeof item === 'object' && 'text' in item
            ? String(item.text ?? '')
            : '',
        )
        .join('');
    }
    return '';
  }

}
