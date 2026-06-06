import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ChatEventsService } from '../../../../modules/chat/chat-events.service';
import type { AgentMachineCode } from '../agent-run-user-messages.util';
import type { MessageBlock, MessageBlockPatch } from '../message/message-blocks.types';
import {
  filterLlmBlocksAvoidDuplicatingRule,
  isStructuredMessageBlock,
  looksLikeBlocksJsonOutput,
  mergeSummarizeBlocksForStorage,
  normalizeMessageBlocks,
  planStructuredBlockStreaming,
  sanitizeMessageBlocks,
  stripMarkdownFenceForBlocksParse,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../message/message-blocks.util';
import type { LlmChatMessage } from '../../../llm/llm.types';
import { LlmService } from '../../../llm/llm.service';
import {
  emitLlmPromptDebug,
  isLlmPromptDebugEnabled,
} from '../llm-prompt-debug.util';
import { sanitizeLlmFinalOutput } from '../llm-output-sanitize.util';
import {
  createLlmStreamRouterState,
  routeLlmStreamChunk,
} from '../llm-stream-router.util';

@Injectable()
export class AgentRunSseEmitter {
  private readonly logger = new Logger(AgentRunSseEmitter.name);
  /** SSE result 流式序号；key = sessionId:runId */
  private readonly streamSeq = new Map<string, number>();
  /** 本 run 已推送过 message 流式增量（key = sessionId:runId） */
  private readonly messageStreamDeltaEmitted = new Set<string>();
  /** 本 run 正文已通过 SSE 交付，run() 末尾无需再补 stream full */
  readonly runSseContentDelivered = new Set<string>();

  constructor(
    private readonly chatEvents: ChatEventsService,
    private readonly llmService: LlmService,
  ) {}

  thinkBufferKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  resetThinkBuffer(_sessionId: string, _runId: number): void {
    // no-op：think/message 均由前端按 SSE 增量拼接
  }

  clearThinkBuffer(sessionId: string, runId: number): void {
    const key = this.thinkBufferKey(sessionId, runId);
    this.streamSeq.delete(key);
    this.messageStreamDeltaEmitted.delete(key);
    this.runSseContentDelivered.delete(key);
  }

  markRunSseContentDelivered(
    runKey: string,
    blocks: MessageBlock[],
    options: { textStreamed: boolean; structuredPatches: number },
  ): void {
    const hasStructured = blocks.some(isStructuredMessageBlock);
    const hasText = blocks.some((block) => block.type === 'text');
    if (!hasStructured && hasText && options.textStreamed) {
      this.runSseContentDelivered.add(runKey);
      return;
    }
    if (hasStructured && options.structuredPatches > 0) {
      this.runSseContentDelivered.add(runKey);
    }
  }

  emitRunMessageBlocksIfNeeded(
    sessionId: string,
    runId: number,
    turnId: number,
    blocks: MessageBlock[],
  ): void {
    const runKey = this.thinkBufferKey(sessionId, runId);
    if (blocks.length === 0) {
      return;
    }
    if (this.runSseContentDelivered.has(runKey)) {
      return;
    }
    if (
      this.messageStreamDeltaEmitted.has(runKey) &&
      blocks.every((block) => block.type === 'text')
    ) {
      return;
    }
    this.emitMessageBlocks(sessionId, runId, blocks, {
      action: 'stream',
      mode: 'full',
      turnId,
    });
    this.runSseContentDelivered.add(runKey);
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
    },
  ): void {
    const normalized = normalizeMessageBlocks(blocks);
    if (normalized.length === 0) {
      return;
    }
    const key = runId == null ? null : this.thinkBufferKey(sessionId, runId);
    const action = options?.action ?? 'stream';
    const mode = options?.mode ?? 'full';
    if (key && action === 'stream' && mode === 'delta') {
      this.messageStreamDeltaEmitted.add(key);
    }
    const nextSeq = key ? (this.streamSeq.get(key) ?? 0) + 1 : undefined;
    if (key && nextSeq != null) {
      this.streamSeq.set(key, nextSeq);
    }
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action,
        runId,
        turnId: options?.turnId,
        blocks: normalized,
        code: options?.code,
        seq: nextSeq,
        mode,
      },
    });
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
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'patch',
        runId,
        patches: [{ replaceId: patch.replaceId, block }],
        seq: nextSeq,
      },
    });
  }

  emitLlmReply(
    sessionId: string,
    runId: number | undefined,
    output: string,
    options?: {
      code?: AgentMachineCode;
      mode?: 'delta' | 'full';
      turnId?: number;
    },
  ): void {
    const text = this.sanitizeFinalOutput(output);
    if (!text) {
      return;
    }
    this.emitMessageBlocks(sessionId, runId, [textBlock(text)], {
      code: options?.code,
      mode: options?.mode ?? 'delta',
      turnId: options?.turnId,
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
  ): Promise<MessageBlock[]> {
    const runKey = this.thinkBufferKey(sessionId, runId);
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
      });
    }

    // 始终流式推送 summarize 正文；仅在输出转向 blocks JSON 时停止 delta
    let streamTextDeltas = true;
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
          if (!streamTextDeltas) {
            return;
          }
          if (looksLikeBlocksJsonOutput(streamed)) {
            streamTextDeltas = false;
            return;
          }
          const routed = routeLlmStreamChunk(streamRouter, delta.contentDelta);
          streamRouter = routed.state;
          if (routed.think) {
            this.emitThink(sessionId, runId, routed.think, 'delta');
          }
          if (routed.message) {
            this.emitMessageBlocks(
              sessionId,
              runId,
              [textBlock(routed.message)],
              { mode: 'delta', action: 'stream' },
            );
          }
        },
      },
    );
    const normalizedResultText = sanitizeLlmFinalOutput(result.content ?? '');
    if (!streamed.trim() && normalizedResultText) {
      const streamMeta = result.streamMeta;
      if (streamMeta?.fellBackToInvoke) {
        this.logger.warn(
          `summarize stream fallback to invoke runId=${runId} model=${result.model}`,
        );
      } else {
        this.logger.warn(
          `summarize stream no delta runId=${runId} model=${result.model} emittedDeltaCount=${streamMeta?.emittedDeltaCount ?? 0}`,
        );
      }
    }

    const rawLlmText = sanitizeLlmFinalOutput(
      streamed.trim() || normalizedResultText || fallbackPlainText,
    );
    const parsedLlmBlocks = tryParseStoredMessageBlocks(
      stripMarkdownFenceForBlocksParse(rawLlmText),
    );
    const llmBlocksFromParse = parsedLlmBlocks
      ? sanitizeMessageBlocks(
          filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, parsedLlmBlocks),
        )
      : [];

    for (const patch of patches) {
      this.emitBlockPatch(sessionId, runId, patch);
    }

    const textStreamedViaDelta =
      streamTextDeltas && streamed.trim().length > 0;
    const canEmitSupplementaryTextFull = !textStreamedViaDelta;

    if (llmBlocksFromParse.length > 0) {
      const structuredFromLlm = llmBlocksFromParse.filter(
        isStructuredMessageBlock,
      );
      const textFromLlm = llmBlocksFromParse.filter(
        (block) => block.type === 'text',
      );
      // patch 已下发 rule table/chart 后，不再 full 推同类型 structured block
      if (structuredFromLlm.length > 0 && patches.length === 0) {
        this.emitMessageBlocks(sessionId, runId, structuredFromLlm, {
          action: 'stream',
          mode: 'full',
        });
      }
      // patch 之后仍可 full 推补充 text（分析报告等），但不重复 pipe 表格
      if (textFromLlm.length > 0 && canEmitSupplementaryTextFull) {
        this.emitMessageBlocks(sessionId, runId, textFromLlm, {
          action: 'stream',
          mode: 'full',
        });
      }
    } else if (canEmitSupplementaryTextFull && rawLlmText.trim()) {
      const fallbackTextBlocks = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
        textBlock(rawLlmText, 'markdown'),
      ]);
      if (fallbackTextBlocks.length > 0) {
        this.emitMessageBlocks(sessionId, runId, fallbackTextBlocks, {
          action: 'stream',
          mode: 'full',
        });
      }
    }

    const llmBlocksForStorage =
      llmBlocksFromParse.length > 0
        ? llmBlocksFromParse
        : rawLlmText.trim() && !looksLikeBlocksJsonOutput(rawLlmText)
          ? filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
              textBlock(rawLlmText, 'markdown'),
            ])
          : [];
    const sanitizedMerged = sanitizeMessageBlocks(
      mergeSummarizeBlocksForStorage(
        ruleBlocks,
        llmBlocksForStorage,
        fallbackPlainText,
      ),
    );
    this.markRunSseContentDelivered(runKey, sanitizedMerged, {
      textStreamed:
        textStreamedViaDelta ||
        llmBlocksForStorage.some((block) => block.type === 'text'),
      structuredPatches: patches.length,
    });
    return sanitizedMerged;
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

  private sanitizeFinalOutput(value: string): string {
    return sanitizeLlmFinalOutput(value);
  }

}
