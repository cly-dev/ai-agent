import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { AgentRunSseGateway } from '../../../../session-run/agent-run-sse.gateway';
import type { AgentMachineCode } from '../../agent-run-user-messages.util';
import type { MessageBlock, MessageBlockPatch } from '../../message/message-blocks.types';
import {
  extractStreamableProseFromBlocks,
  filterLlmBlocksAvoidDuplicatingRule,
  looksLikeBlocksJsonOutput,
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
  emitAgentMessageSseDebug,
} from '../../message/message-blocks-debug.util';
import {
  AgentRunAbortedError,
  isAgentRunAbortedError,
} from '../../../../session-run/run-aborted.error';

/**
 * 用户可见 assistant 消息的唯一发布出口：
 * 1. commit RunAssistantArtifact（落库同源）
 * 2. 无 LLM delta 时按 artifact 回放 prose delta
 * 3. 推 authoritative stream.full（payload 必来自 artifact，与 DB 一致）
 */
@Injectable()
export class AgentRunSseEmitter {
  private readonly logger = new Logger(AgentRunSseEmitter.name);
  /** SSE result 流式序号；key = sessionId:runId */
  private readonly streamSeq = new Map<string, number>();
  /** 本轮是否已推过 prose delta。 */
  private readonly runProseDeltaEmitted = new Map<string, boolean>();
  /** 已推送的权威 full 序列化串（与 artifact.serialized 一致）；finish 去重。 */
  private readonly runAuthoritativeFullSerialized = new Map<string, string>();

  constructor(
    private readonly runSse: AgentRunSseGateway,
    private readonly llmService: LlmService,
    private readonly assistantArtifact: RunAssistantArtifactStore,
  ) {}

  private shouldEmitForRun(sessionId: string, runId: number | undefined): boolean {
    if (runId == null) {
      return true;
    }
    return this.runSse.canPublishRun(sessionId, runId);
  }

  thinkBufferKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  clearThinkBuffer(sessionId: string, runId: number): void {
    const key = this.thinkBufferKey(sessionId, runId);
    this.streamSeq.delete(key);
    this.runProseDeltaEmitted.delete(key);
    this.runAuthoritativeFullSerialized.delete(key);
  }

  /**
   * run 收尾：若 artifact 存在且权威 full 尚未推送，补推与落库完全一致的 full。
   */
  emitRunMessageBlocksIfNeeded(
    sessionId: string,
    runId: number,
    turnId: number,
  ): void {
    const artifact = this.assistantArtifact.peek(sessionId, runId);
    if (!artifact?.blocks.length) {
      return;
    }
    const turnIdResolved =
      turnId ??
      this.assistantArtifact.peekTurnId(sessionId, runId) ??
      undefined;
    this.emitAuthoritativeFullFromArtifact(sessionId, runId, {
      turnId: turnIdResolved,
      replayProseIfNeeded: true,
      debugOrigin: 'emitRunMessageBlocksIfNeeded',
    });
  }

  /** 仅规则化 blocks：loading → patch → 权威 full。 */
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
    this.runSse.emitThink(sessionId, runId, { content: chunk, mode });
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
    if (runId != null && !this.shouldEmitForRun(sessionId, runId)) {
      return;
    }
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
    if (key && mode === 'delta') {
      this.runProseDeltaEmitted.set(key, true);
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
    this.runSse.emitAgentRunMessage(sessionId, runId, payload);
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
    if (!this.shouldEmitForRun(sessionId, runId)) {
      return;
    }
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
    this.runSse.emitAgentRunMessage(sessionId, runId, payload);
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
    abortSignal?: AbortSignal,
  ): Promise<AIMessage> {
    const signal =
      abortSignal ?? this.runSse.getRunAbortSignal(sessionId, runId);
    let merged: AIMessageChunk | undefined;
    let streamedText = '';
    try {
      if (signal?.aborted) {
        this.throwRunAborted(sessionId, runId);
      }
      const stream = await runnable.stream(messages);
      for await (const chunk of stream) {
        if (signal?.aborted) {
          this.throwRunAborted(sessionId, runId);
        }
        const row = chunk as AIMessageChunk;
        const delta = this.extractAiMessageText(row as AIMessage);
        if (delta) {
          streamedText += delta;
          this.emitThink(sessionId, runId, delta, 'delta');
        }
        merged = merged ? merged.concat(row) : row;
      }
    } catch (error) {
      if (isAgentRunAbortedError(error)) {
        throw error;
      }
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        this.throwRunAborted(sessionId, runId);
      }
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

  async summarizeMessageBlocks(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    fallbackPlainText: string,
    _delivery: SummarizeLlmDelivery,
    publishMode?: PlanSummarizePublishMode,
  ): Promise<{ blocks: MessageBlock[]; rawOutput: string }> {
    return this.streamSummarizeProseOnly(
      messages,
      sessionId,
      runId,
      ruleBlocks,
      fallbackPlainText,
      publishMode,
    );
  }

  /**
   * 仅写入 artifact（plan 中间步等）；SSE 权威 full 由 finish 或后续 publish 补推。
   */
  commitAssistantArtifact(
    sessionId: string,
    runId: number,
    blocks: MessageBlock[],
    phase: RunAssistantArtifactPhase = 'final',
  ): MessageBlock[] {
    const committed = this.assistantArtifact.commit(
      sessionId,
      runId,
      blocks,
      phase,
    );
    return committed?.blocks ?? [];
  }

  private replayStaticProseBeforeFull(
    sessionId: string,
    runId: number,
    prose: string,
    turnId?: number,
  ): void {
    const trimmed = prose.trim();
    if (!trimmed) {
      return;
    }
    const proseSession = createSummarizeProseStreamSession({
      onProseDelta: (delta) => {
        this.emitMessageBlocks(sessionId, runId, [textBlock(delta)], {
          action: 'stream',
          mode: 'delta',
          turnId,
        });
      },
    });
    proseSession.replayRoutedMessage(trimmed);
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
      this.commitAssistantArtifact(
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
    return { blocks, rawOutput };
  }

  /**
   * 从已 commit 的 artifact 推送权威 full；payload 与 artifact.serialized 严格一致。
   */
  private emitAuthoritativeFullFromArtifact(
    sessionId: string,
    runId: number,
    options: {
      turnId?: number;
      code?: AgentMachineCode;
      replayProseIfNeeded?: boolean;
      debugOrigin: string;
    },
  ): MessageBlock[] {
    const artifact = this.assistantArtifact.peek(sessionId, runId);
    if (!artifact?.blocks.length) {
      return [];
    }
    const streamKey = this.thinkBufferKey(sessionId, runId);
    if (
      this.runAuthoritativeFullSerialized.get(streamKey) === artifact.serialized
    ) {
      return artifact.blocks;
    }

    const turnId =
      options.turnId ??
      this.assistantArtifact.peekTurnId(sessionId, runId) ??
      undefined;

    if (options.replayProseIfNeeded) {
      const hadProseDelta = this.runProseDeltaEmitted.get(streamKey) ?? false;
      if (!hadProseDelta) {
        this.replayStaticProseBeforeFull(
          sessionId,
          runId,
          extractStreamableProseFromBlocks(artifact.blocks),
          turnId,
        );
      }
    }

    this.emitMessageBlocks(sessionId, runId, artifact.blocks, {
      action: 'stream',
      mode: 'full',
      turnId,
      code: options.code,
      debugSource: {
        origin: options.debugOrigin,
        artifactSerialized: artifact.serialized,
        artifactPhase: artifact.phase,
      },
    });
    this.runAuthoritativeFullSerialized.set(streamKey, artifact.serialized);
    return artifact.blocks;
  }

  async streamProseLlm(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    options?: {
      turnId?: number;
      beforeStream?: () => void;
      abortSignal?: AbortSignal;
      messageTokenBudget?: number;
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
    const boundGeneration = this.runSse.getBoundRunGeneration(sessionId, runId);
    if (boundGeneration != null) {
      this.runSse.throwIfAborted(sessionId, runId, boundGeneration);
    }
    const proseSession = createSummarizeProseStreamSession({
      onProseDelta: (delta) => {
        if (!this.shouldEmitForRun(sessionId, runId)) {
          return;
        }
        this.emitMessageBlocks(sessionId, runId, [textBlock(delta)], {
          mode: 'delta',
          action: 'stream',
          turnId,
        });
      },
      onThinkDelta: (think) => {
        if (!this.shouldEmitForRun(sessionId, runId)) {
          return;
        }
        this.emitThink(sessionId, runId, think, 'delta');
      },
    });
    options?.beforeStream?.();

    const abortSignal =
      options?.abortSignal ?? this.runSse.getRunAbortSignal(sessionId, runId);

    let streamed = '';
    try {
      const result = await this.llmService.streamChat(
        {
          messages,
          tools: [],
          signal: abortSignal,
          messageTokenBudget: options?.messageTokenBudget,
          budgetHints: {
            callKind: 'summarize',
            sessionId,
            runId,
            phase: 'summarize',
          },
        },
        {
          signal: abortSignal,
          onDelta: (delta) => {
            if (!this.shouldEmitForRun(sessionId, runId)) {
              return;
            }
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
    } catch (error) {
      if (isAgentRunAbortedError(error)) {
        throw error;
      }
      if (
        abortSignal?.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        this.throwRunAborted(sessionId, runId);
      }
      throw error;
    }
  }

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
      const canonicalProse = sanitizeSummarizeUserFacingProse(
        sanitizeLlmFinalOutput(
          userMarkdown || routedMessage || rawLlmSource || fallbackPlainText,
        ),
      ).trim();
      if (canonicalProse) {
        llmBlocksForStorage = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
          textBlock(canonicalProse, 'markdown'),
        ]);
      }
      if (proseSession.proseStreamSuperseded) {
        this.logger.warn(
          `summarize prose stream superseded by blocks JSON runId=${runId}`,
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
    );
  }

  /**
   * 用户可见 assistant 定稿唯一出口：先 commit artifact，再推与 artifact 一致的权威 full。
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
    if (!this.shouldEmitForRun(sessionId, runId)) {
      return [];
    }
    const sanitized = sanitizeMessageBlocks(blocks);
    if (sanitized.length === 0) {
      return [];
    }

    if (options?.commitArtifact !== false) {
      this.assistantArtifact.commit(
        sessionId,
        runId,
        sanitized,
        options?.phase ?? 'final',
      );
    }

    return this.emitAuthoritativeFullFromArtifact(sessionId, runId, {
      turnId: options?.turnId,
      code: options?.code,
      replayProseIfNeeded: true,
      debugOrigin: 'publishAssistantBlocks',
    });
  }

  private throwRunAborted(sessionId: string, runId: number): never {
    const bound = this.runSse.getBoundRunGeneration(sessionId, runId);
    if (bound != null) {
      this.runSse.throwIfAborted(sessionId, runId, bound);
    }
    throw new AgentRunAbortedError(sessionId, runId, 'superseded');
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
