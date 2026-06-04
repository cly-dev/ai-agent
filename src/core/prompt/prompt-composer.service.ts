import { Injectable, Logger } from '@nestjs/common';
import { SessionHistoryCompressionService } from '../memory/session-history-compression.service';
import { UserMemoryStore } from '../memory/user-memory.store';
import { WorkingMemoryService } from '../memory/working-memory.service';
import {
  dbMessageRowToMessageTurn,
} from '../memory/session-context.format';
import { SessionContextStore } from '../memory/session-context.store';
import {
  isSessionContextPayload,
  type SessionContextPayload,
} from '../memory/session-context.types';
import { PrismaService } from '../../prisma/prisma.service';
import type { LlmChatMessage } from '../llm/llm.types';
import { PROMPT_KEYS } from './prompt-template.keys';
import { PromptRegistryService } from './prompt-registry.service';
import type { PromptComposeInput, PromptComposeOutput } from './prompt.types';

@Injectable()
export class PromptComposerService {
  private readonly logger = new Logger(PromptComposerService.name);

  /**
   * 会话上下文：优先 Redis；送入模型时由 `SessionHistoryCompressionService` 做摘要 + 最近轮次。
   */
  private static readonly MAX_SESSION_MESSAGES = 80;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userMemoryStore: UserMemoryStore,
    private readonly workingMemoryService: WorkingMemoryService,
    private readonly sessionHistoryCompression: SessionHistoryCompressionService,
    private readonly sessionContextStore: SessionContextStore,
    private readonly promptRegistry: PromptRegistryService,
  ) {}

  async compose(input: PromptComposeInput): Promise<PromptComposeOutput> {
    const sessionScope =
      input.sessionScope ?? (await this.loadSessionScope(input.sessionId));
    const agentPromptSource =
      input.agentSystemPrompt !== undefined
        ? this.composeAgentPrompt(input.agentSystemPrompt)
        : await this.loadAgentPrompt(input.sessionId);
    const [
      userMemory,
      workingMemory,
      conversation,
      responseStyle,
      messageBlocksSpec,
    ] = await Promise.all([
      this.userMemoryStore.get(input.userId),
      this.workingMemoryService.get(input.sessionId),
      this.loadRecentConversationMessages(input.sessionId),
      this.promptRegistry.render(PROMPT_KEYS.PLATFORM_RESPONSE_STYLE, sessionScope),
      this.promptRegistry.render(
        PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
        sessionScope,
      ),
    ]);
    const agentPrompt = agentPromptSource;

    const messages: LlmChatMessage[] = [];

    if (agentPrompt) {
      messages.push({
        role: 'system',
        content: `<agent_prompt>\n${agentPrompt}\n</agent_prompt>`,
      });
    }

    messages.push({
      role: 'system',
      content: responseStyle,
    });

    messages.push({
      role: 'system',
      content: messageBlocksSpec,
    });

    if (userMemory) {
      messages.push({
        role: 'system',
        content: `<user_memory>\n${JSON.stringify(userMemory)}\n</user_memory>`,
      });
    }

    if (workingMemory) {
      messages.push({
        role: 'system',
        content: `<working_memory>\n${JSON.stringify(workingMemory)}\n</working_memory>`,
      });
    }

    if (conversation.length > 0) {
      messages.push({
        role: 'system',
        content:
          '<session_history>Earlier turns may appear as session_history_summary; recent turns follow. Prefer working_memory for task state.</session_history>',
      });
      for (const turn of conversation) {
        messages.push(turn);
      }
    } else if (input.latestUserMessage.trim().length > 0) {
      this.logger.debug(
        `compose sessionId=${input.sessionId}: no prior messages (first turn or empty history)`,
      );
    }

    const latest = input.latestUserMessage.trim();
    const lastTurn = conversation[conversation.length - 1];
    const alreadyContainsLatest =
      lastTurn?.role === 'user' && (lastTurn.content ?? '').trim() === latest;

    if (!alreadyContainsLatest && latest.length > 0) {
      messages.push({
        role: 'user',
        content: input.latestUserMessage,
      });
    }

    return { messages };
  }

  /** 将会话历史写入 Redis，供后续 compose / run 命中。 */
  async warmSessionContext(sessionId: string): Promise<boolean> {
    const fromRedis = await this.loadFromRedis(sessionId);
    if (fromRedis !== null) {
      return true;
    }
    const { payload } = await this.loadFromDatabase(sessionId);
    if (payload.turns.length === 0) {
      return false;
    }
    return this.sessionContextStore.trySet(sessionId, payload);
  }

  private async loadRecentConversationMessages(
    sessionId: string,
  ): Promise<LlmChatMessage[]> {
    const fromRedis = await this.loadFromRedis(sessionId);
    if (fromRedis !== null) {
      return fromRedis;
    }

    this.logger.debug(
      `session context cache miss sessionId=${sessionId}, loading from DB`,
    );
    const { messages, payload } = await this.loadFromDatabase(sessionId);
    const warmed = await this.sessionContextStore.trySet(sessionId, payload);
    if (!warmed) {
      this.logger.debug(
        `session context not cached (Redis unavailable) sessionId=${sessionId}`,
      );
    }
    return messages;
  }

  private async loadFromRedis(
    sessionId: string,
  ): Promise<LlmChatMessage[] | null> {
    const raw = await this.sessionContextStore.get(sessionId);
    if (!raw || !isSessionContextPayload(raw)) {
      return null;
    }
    if (raw.sessionId !== sessionId) {
      return null;
    }
    return this.sessionHistoryCompression.buildPromptHistory(
      raw,
      PromptComposerService.MAX_SESSION_MESSAGES,
    );
  }

  private async loadFromDatabase(sessionId: string): Promise<{
    messages: LlmChatMessage[];
    payload: SessionContextPayload;
  }> {
    const rows = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        toolName: true,
        toolInput: true,
        toolOutput: true,
        createdAt: true,
      },
    });
    const turns = rows.map((row) => dbMessageRowToMessageTurn(row));
    const payload: SessionContextPayload = {
      sessionId,
      turns,
      updatedAt: new Date().toISOString(),
    };
    const cached = await this.sessionContextStore.get(sessionId);
    if (cached && isSessionContextPayload(cached)) {
      payload.workingMemory = cached.workingMemory;
      payload.compressedHistorySummary = cached.compressedHistorySummary;
      payload.compressedUpToMessageId = cached.compressedUpToMessageId;
    }
    return {
      messages: this.sessionHistoryCompression.buildPromptHistory(
        payload,
        PromptComposerService.MAX_SESSION_MESSAGES,
      ),
      payload,
    };
  }

  private async loadSessionScope(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { agentId: true, appClientId: true },
    });
    return {
      appClientId: session?.appClientId ?? null,
      agentId: session?.agentId ?? null,
    };
  }

  private async loadAgentPrompt(sessionId: string): Promise<string | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { agentId: true, appClientId: true },
    });

    if (!session?.agentId) {
      return null;
    }

    const agent = await this.prisma.agent.findFirst({
      where: { id: session.agentId, appClientId: session.appClientId },
      select: { systemPrompt: true },
    });
    return this.composeAgentPrompt(agent?.systemPrompt ?? null);
  }

  private composeAgentPrompt(systemPrompt: string | null): string | null {
    if (!systemPrompt) {
      return null;
    }
    const value = systemPrompt.trim();
    return value.length > 0 ? value : null;
  }
}
