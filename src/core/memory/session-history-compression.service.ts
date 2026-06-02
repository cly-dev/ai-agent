import { Injectable, Logger } from '@nestjs/common';
import { estimateTextTokens } from '../llm/message-token-budget.util';
import { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import {
  formatMessageTurnBody,
  messageTurnsToLlmMessages,
} from './session-context.format';
import {
  getSessionHistoryCompressAfterTurns,
  getSessionHistoryCompressMaxInputTokens,
  getSessionHistoryCompressMaxSummaryTokens,
  getSessionHistoryKeepRecentTurns,
  isSessionHistoryCompressionEnabled,
  isSessionHistoryTrimTurnsAfterCompressEnabled,
} from './memory.constants';
import { trimTurnsByCompressedWatermark } from './session-context-trim.util';
import {
  formatWorkingMemoryFactsForCompression,
  isSessionHistorySummaryAcceptable,
} from './session-history-summary.util';
import { PROMPT_KEYS } from '../prompt/prompt-template.keys';
import { PromptRegistryService } from '../prompt/prompt-registry.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionContextStore } from './session-context.store';
import {
  isSessionContextPayload,
  type SessionContextPayload,
  type SessionContextTurn,
} from './session-context.types';

const MAX_TURN_CHARS_FOR_COMPRESS = 600;

@Injectable()
export class SessionHistoryCompressionService {
  private readonly logger = new Logger(SessionHistoryCompressionService.name);

  constructor(
    private readonly sessionContextStore: SessionContextStore,
    private readonly llmService: LlmService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 将较早轮次压缩为摘要写入 Redis；DB 中 Message 仍完整保留。
   * 在每轮 Agent 结束后调用（与 working memory 刷新并列）。
   */
  async maybeCompressAfterTurn(sessionId: string): Promise<void> {
    if (!isSessionHistoryCompressionEnabled()) {
      return;
    }
    try {
      const raw = await this.sessionContextStore.get(sessionId);
      if (!raw || !isSessionContextPayload(raw)) {
        return;
      }
      const keepRecent = getSessionHistoryKeepRecentTurns();
      const compressAfter = getSessionHistoryCompressAfterTurns();
      if (raw.turns.length <= compressAfter) {
        return;
      }

      const oldTurns = raw.turns.slice(0, -keepRecent);
      if (oldTurns.length === 0) {
        return;
      }

      const upToMessageId = oldTurns[oldTurns.length - 1]!.messageId;
      if (
        raw.compressedUpToMessageId != null &&
        upToMessageId <= raw.compressedUpToMessageId
      ) {
        return;
      }

      const summary = await this.synthesizeHistorySummary(
        sessionId,
        raw.compressedHistorySummary,
        oldTurns,
        raw.workingMemory,
      );
      if (!isSessionHistorySummaryAcceptable(summary)) {
        this.logger.warn(
          `session history compression skipped invalid summary sessionId=${sessionId}`,
        );
        return;
      }

      const turnsBefore = raw.turns.length;
      const trimmedTurns = isSessionHistoryTrimTurnsAfterCompressEnabled()
        ? trimTurnsByCompressedWatermark(raw.turns, upToMessageId)
        : raw.turns;

      await this.sessionContextStore.patch(sessionId, {
        compressedHistorySummary: summary,
        compressedUpToMessageId: upToMessageId,
        turns: trimmedTurns,
        updatedAt: new Date().toISOString(),
      });
      this.logger.debug(
        `session history compressed sessionId=${sessionId} upToMessageId=${upToMessageId} oldTurns=${oldTurns.length} turnsBefore=${turnsBefore} turnsAfter=${trimmedTurns.length} trim=${isSessionHistoryTrimTurnsAfterCompressEnabled()}`,
      );
    } catch (error) {
      this.logger.warn(
        `session history compression skipped sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 组装送入模型的会话历史：可选摘要 + 最近 N 轮原文。
   */
  buildPromptHistory(
    payload: SessionContextPayload,
    maxMessages: number,
  ): LlmChatMessage[] {
    const keepRecent = Math.min(
      getSessionHistoryKeepRecentTurns(),
      maxMessages,
    );
    const recentTurns = payload.turns.slice(-keepRecent);
    const messages: LlmChatMessage[] = [];

    const summary = payload.compressedHistorySummary?.trim();
    if (summary) {
      messages.push({
        role: 'system',
        content: `<session_history_summary>\n${summary}\n</session_history_summary>`,
      });
    }

    messages.push(
      ...messageTurnsToLlmMessages(recentTurns, keepRecent),
    );
    return messages;
  }

  private async loadSessionPromptScope(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { appClientId: true, agentId: true },
    });
    return {
      appClientId: session?.appClientId ?? null,
      agentId: session?.agentId ?? null,
    };
  }

  private async synthesizeHistorySummary(
    sessionId: string,
    previousSummary: string | undefined,
    turns: SessionContextTurn[],
    workingMemory: SessionContextPayload['workingMemory'],
  ): Promise<string> {
    const transcript = this.formatTurnsForCompression(turns);
    if (!transcript.trim()) {
      return previousSummary?.trim() ?? '';
    }

    const maxInputTokens = getSessionHistoryCompressMaxInputTokens();
    let body = transcript;
    if (estimateTextTokens(body) > maxInputTokens) {
      body = this.trimTranscriptToTokenBudget(body, maxInputTokens);
    }

    const wmBlock = formatWorkingMemoryFactsForCompression(workingMemory);

    const scope = await this.loadSessionPromptScope(sessionId);
    const systemPrompt = await this.promptRegistry.render(
      PROMPT_KEYS.MEMORY_HISTORY_COMPRESSION,
      scope,
    );

    const userParts = [
      wmBlock,
      previousSummary?.trim()
        ? `已有摘要：\n${previousSummary.trim()}`
        : null,
      `待压缩对话（时间顺序）：\n${body}`,
    ].filter((part): part is string => part != null);

    const result = await this.llmService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userParts.join('\n\n') },
      ],
      maxTokens: getSessionHistoryCompressMaxSummaryTokens(),
      temperature: 0.2,
      stream: false,
    });

    const text = (result.content ?? '').trim();
    return isSessionHistorySummaryAcceptable(text) ? text : '';
  }

  private formatTurnsForCompression(turns: SessionContextTurn[]): string {
    const lines: string[] = [];
    for (const turn of turns) {
      const body = formatMessageTurnBody(turn).trim();
      if (!body) {
        continue;
      }
      const clipped =
        body.length > MAX_TURN_CHARS_FOR_COMPRESS
          ? `${body.slice(0, MAX_TURN_CHARS_FOR_COMPRESS)}…`
          : body;
      lines.push(`${turn.role}: ${clipped}`);
    }
    return lines.join('\n');
  }

  private trimTranscriptToTokenBudget(text: string, tokenBudget: number): string {
    const lines = text.split('\n');
    while (lines.length > 0 && estimateTextTokens(lines.join('\n')) > tokenBudget) {
      lines.shift();
    }
    return lines.join('\n');
  }
}
