import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ChatEventsService } from '../../../../../modules/chat/chat-events.service';
import type { AgentMachineCode } from '../../agent-run-user-messages.util';
import type { MessageBlock, MessageBlockPatch } from '../../message/message-blocks.types';
import {
  filterLlmBlocksAvoidDuplicatingRule,
  looksLikeBlocksJsonOutput,
  mergeStreamedDeltaTextForStorage,
  mergeSummarizeBlocksForStorage,
  messageBlocksToPlainText,
  normalizeMessageBlocks,
  planStructuredBlockStreaming,
  sanitizeMessageBlocks,
  sanitizeSummarizeUserFacingProse,
  serializeMessageBlocksForStorage,
  textBlock,
  tryParseLlmBlocksFromSummarizeOutput,
} from '../../message/message-blocks.util';
import type { LlmChatMessage } from '../../../../llm/llm.types';
import { LlmService } from '../../../../llm/llm.service';
import { extractRoutedMessageFromLlmText } from '../../llm-stream-router.util';
import { emitLlmPromptDebug } from '../../llm-prompt-debug.util';
import { sanitizeLlmFinalOutput } from '../../llm-output-sanitize.util';
import {
  createSummarizeProseStreamSession,
  finalizeSummarizeProseStreamAfterLlm,
  type SummarizeProseStreamSession,
} from '../../summarize-prose-stream.util';
import type { SummarizeLlmDelivery } from '../summarize/summarize-llm-delivery.util';
import {
  RunAssistantArtifactStore,
  type RunAssistantArtifactPhase,
} from './run-assistant-artifact.store';
import type { PlanSummarizePublishMode } from '../plan/task-plan.types';
import {
  emitAgentMessagePersistDebug,
  emitAgentMessageSseDebug,
} from '../../message/message-blocks-debug.util';

@Injectable()
export class AgentRunSseEmitter {
  private readonly logger = new Logger(AgentRunSseEmitter.name);
  /** SSE result 流式序号；key = sessionId:runId */
  private readonly streamSeq = new Map<string, number>();

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

  /**
   * summarize 统一入口：按 delivery 选择 prose 流式 或 blocks 非流式 invoke（互斥协议）。
   */
  async summarizeMessageBlocks(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    fallbackPlainText: string,
    delivery: SummarizeLlmDelivery,
    publishMode?: PlanSummarizePublishMode,
  ): Promise<{ blocks: MessageBlock[]; rawOutput: string }> {
    if (delivery === 'blocks_invoke') {
      return this.invokeSummarizeMessageBlocks(
        messages,
        sessionId,
        runId,
        ruleBlocks,
        fallbackPlainText,
        publishMode,
      );
    }
    return this.streamSummarizeProseOnly(
      messages,
      sessionId,
      runId,
      ruleBlocks,
      fallbackPlainText,
      publishMode,
    );
  }

  private emitRuleBlockPlaceholders(
    runId: number,
    sessionId: string,
    ruleBlocks: MessageBlock[],
    turnId?: number,
  ): MessageBlockPatch[] {
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
    return patches;
  }

  private finishSummarizeBlocks(
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    llmBlocks: MessageBlock[],
    fallbackPlainText: string,
    patches: MessageBlockPatch[],
    rawOutput: string,
    publishMode: PlanSummarizePublishMode | undefined,
    turnId: number | undefined,
    reconcile?: {
      streamedProse?: string;
      proseStreamSuperseded?: boolean;
    },
  ): { blocks: MessageBlock[]; rawOutput: string } {
    for (const patch of patches) {
      this.emitBlockPatch(sessionId, runId, patch);
    }
    const sanitizedMerged = sanitizeMessageBlocks(
      mergeSummarizeBlocksForStorage(ruleBlocks, llmBlocks, fallbackPlainText),
    );
    const artifactPhase: RunAssistantArtifactPhase =
      publishMode?.artifactPhase ?? 'final';
    const emitAuthoritativeFull = publishMode?.emitAuthoritativeFull !== false;

    if (!emitAuthoritativeFull) {
      this.assistantArtifact.commit(
        sessionId,
        runId,
        sanitizedMerged,
        artifactPhase,
      );
      return { blocks: sanitizedMerged, rawOutput };
    }

    const blocks = this.publishAssistantBlocks(sessionId, runId, sanitizedMerged, {
      turnId,
      phase: artifactPhase,
    });
    if (reconcile) {
      this.reconcileProseStreamWithFinalBlocks(
        sessionId,
        runId,
        turnId,
        reconcile,
        blocks,
      );
    }
    return { blocks, rawOutput };
  }

  /** 流式 delta 与定稿 blocks 不一致时，再推一次 authoritative full 覆盖前端累积态。 */
  reconcileProseStreamWithFinalBlocks(
    sessionId: string,
    runId: number,
    turnId: number | undefined,
    input: { streamedProse?: string; proseStreamSuperseded?: boolean },
    blocks: MessageBlock[],
  ): void {
    const streamed = input.streamedProse?.trim() ?? '';
    if (!streamed && !input.proseStreamSuperseded) {
      return;
    }
    const publishedSerialized = serializeMessageBlocksForStorage(blocks);
    const deltaOnlySerialized = streamed
      ? serializeMessageBlocksForStorage([textBlock(streamed, 'markdown')])
      : '';
    const mismatch =
      input.proseStreamSuperseded ||
      (deltaOnlySerialized !== '' &&
        deltaOnlySerialized !== publishedSerialized);
    if (!mismatch) {
      return;
    }
    emitAgentMessagePersistDebug({
      tag: 'SSE_PROSE_STREAM_RECONCILE',
      sessionId,
      runId,
      turnId,
      dbContent: publishedSerialized,
      source: {
        streamedDeltaProse: streamed,
        proseStreamSuperseded: input.proseStreamSuperseded ?? false,
        publishedBlocks: blocks,
        publishedSerialized,
        deltaOnlySerialized,
      },
    });
    this.emitMessageBlocks(sessionId, runId, blocks, {
      action: 'stream',
      mode: 'full',
      turnId,
      debugSource: { origin: 'reconcileProseStreamWithFinalBlocks' },
    });
  }

  /**
   * 共用 prose 流式 LLM：summarize / plan present 等场景统一走此入口。
   */
  async streamProseLlm(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    options?: {
      turnId?: number;
      beforeStream?: () => void;
    },
  ): Promise<{
    userMarkdown: string;
    routedMessage: string;
    rawLlmSource: string;
    proseSession: SummarizeProseStreamSession;
    model: string;
    turnId?: number;
  }> {
    const turnId =
      options?.turnId ??
      this.assistantArtifact.peekTurnId(sessionId, runId) ??
      undefined;
    const proseSession = createSummarizeProseStreamSession({
      onProseDelta: (delta) => {
        this.emitMessageBlocks(sessionId, runId, [textBlock(delta)], {
          mode: 'delta',
          action: 'stream',
          turnId,
        });
      },
      onThinkDelta: (think) => {
        this.emitThink(sessionId, runId, think, 'delta');
      },
    });
    options?.beforeStream?.();

    let streamed = '';
    const result = await this.llmService.streamChat(
      { messages, tools: [] },
      {
        onDelta: (delta) => {
          if (!delta.contentDelta) {
            return;
          }
          streamed += delta.contentDelta;
          proseSession.ingestLlmDelta(delta.contentDelta);
        },
      },
    );
    const rawStreamedText = streamed.trim();
    const rawResultText = (result.content ?? '').trim();
    const finalized = finalizeSummarizeProseStreamAfterLlm({
      session: proseSession,
      rawStreamedText,
      rawResultText,
      onReplay: (reason) => {
        this.logger.warn(
          `prose stream replay reason=${reason} runId=${runId} model=${result.model}`,
        );
      },
    });
    if (!rawStreamedText && rawResultText && !proseSession.messageDeltaEmitted) {
      this.logger.warn(
        `prose stream no delta runId=${runId} model=${result.model} emittedDeltaCount=${result.streamMeta?.emittedDeltaCount ?? 0}`,
      );
    }
    return {
      ...finalized,
      proseSession,
      model: result.model,
      turnId,
    };
  }

  /** blocks_invoke：非流式整段 JSON → 解析 MessageBlock[]，不向用户推送 JSON token。 */
  private async invokeSummarizeMessageBlocks(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    fallbackPlainText: string,
    publishMode?: PlanSummarizePublishMode,
  ): Promise<{ blocks: MessageBlock[]; rawOutput: string }> {
    const turnId =
      this.assistantArtifact.peekTurnId(sessionId, runId) ?? undefined;
    const summarizeDebugFile = emitLlmPromptDebug(
      (message) => this.logger.log(message),
      {
        runId,
        sessionId,
        phase: 'summarize',
        messages,
        meta: { ruleBlockCount: ruleBlocks.length, delivery: 'blocks_invoke' },
      },
    );
    if (summarizeDebugFile) {
      this.logger.log(
        `LLM summarize invoke file runId=${runId} path=${summarizeDebugFile}`,
      );
    }
    const patches = this.emitRuleBlockPlaceholders(
      runId,
      sessionId,
      ruleBlocks,
      turnId,
    );

    const result = await this.llmService.chat({ messages, tools: [] });
    const rawLlmSource = (result.content ?? '').trim();
    const routedMessage = rawLlmSource
      ? extractRoutedMessageFromLlmText(rawLlmSource)
      : '';
    const parseSource = routedMessage || rawLlmSource;
    const parsed = tryParseLlmBlocksFromSummarizeOutput(parseSource);
    let llmBlocks: MessageBlock[] = [];
    if (parsed?.length) {
      llmBlocks = sanitizeMessageBlocks(
        filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, parsed),
      );
    } else if (parseSource && !looksLikeBlocksJsonOutput(parseSource)) {
      const prose = sanitizeSummarizeUserFacingProse(
        sanitizeLlmFinalOutput(parseSource),
      ).trim();
      if (prose) {
        llmBlocks = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
          textBlock(prose, 'markdown'),
        ]);
      }
    } else if (parseSource && looksLikeBlocksJsonOutput(parseSource)) {
      this.logger.warn(
        `summarize blocks_invoke parse failed runId=${runId} model=${result.model}`,
      );
    }

    return this.finishSummarizeBlocks(
      sessionId,
      runId,
      ruleBlocks,
      llmBlocks,
      fallbackPlainText,
      patches,
      parseSource,
      publishMode,
      turnId,
    );
  }

  /** prose_stream：仅流式 Markdown；最终由服务端 textBlock + ruleBlocks 组装，不解析流内 blocks JSON。 */
  private async streamSummarizeProseOnly(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    fallbackPlainText: string,
    publishMode?: PlanSummarizePublishMode,
  ): Promise<{ blocks: MessageBlock[]; rawOutput: string }> {
    const turnId =
      this.assistantArtifact.peekTurnId(sessionId, runId) ?? undefined;
    const summarizeDebugFile = emitLlmPromptDebug(
      (message) => this.logger.log(message),
      {
        runId,
        sessionId,
        phase: 'summarize',
        messages,
        meta: { ruleBlockCount: ruleBlocks.length, delivery: 'prose_stream' },
      },
    );
    if (summarizeDebugFile) {
      this.logger.log(
        `LLM summarize stream file runId=${runId} path=${summarizeDebugFile}`,
      );
    }
    const patches = this.emitRuleBlockPlaceholders(
      runId,
      sessionId,
      ruleBlocks,
      turnId,
    );

    const { routedMessage, rawLlmSource, userMarkdown, proseSession } =
      await this.streamProseLlm(messages, sessionId, runId, { turnId });

    const streamedMessageText =
      proseSession.sanitizedEmitted || userMarkdown;
    const rawSource = (routedMessage || rawLlmSource || '').trim();
    let llmBlocksForStorage: MessageBlock[] = [];

    if (rawSource && looksLikeBlocksJsonOutput(rawSource)) {
      const disobeyed = tryParseLlmBlocksFromSummarizeOutput(rawSource);
      if (disobeyed?.length) {
        this.logger.warn(
          `summarize prose_stream: model returned blocks JSON instead of markdown runId=${runId}`,
        );
        llmBlocksForStorage = sanitizeMessageBlocks(
          filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, disobeyed),
        );
      } else {
        this.logger.warn(
          `summarize prose_stream: unparseable blocks JSON discarded runId=${runId}`,
        );
        const coerced = messageBlocksToPlainText(
          mergeSummarizeBlocksForStorage(ruleBlocks, [], fallbackPlainText),
        );
        if (coerced.trim()) {
          llmBlocksForStorage = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
            textBlock(coerced, 'markdown'),
          ]);
        }
      }
    } else {
      const proseSource = sanitizeSummarizeUserFacingProse(
        sanitizeLlmFinalOutput(
          streamedMessageText ||
            routedMessage ||
            rawLlmSource ||
            fallbackPlainText,
        ),
      ).trim();
      if (proseSource) {
        llmBlocksForStorage = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
          textBlock(proseSource, 'markdown'),
        ]);
      }
      if (
        streamedMessageText.trim() &&
        !looksLikeBlocksJsonOutput(streamedMessageText) &&
        !proseSession.proseStreamSuperseded
      ) {
        llmBlocksForStorage = mergeStreamedDeltaTextForStorage(
          ruleBlocks,
          llmBlocksForStorage,
          streamedMessageText,
        );
      }
    }

    return this.finishSummarizeBlocks(
      sessionId,
      runId,
      ruleBlocks,
      llmBlocksForStorage,
      fallbackPlainText,
      patches,
      routedMessage || rawLlmSource,
      publishMode,
      turnId,
      {
        streamedProse: proseSession.sanitizedEmitted,
        proseStreamSuperseded: proseSession.proseStreamSuperseded,
      },
    );
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
