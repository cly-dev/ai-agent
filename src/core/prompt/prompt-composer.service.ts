import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { UserMemoryStore } from '../memory/user-memory.store';
import { PrismaService } from '../../prisma/prisma.service';
import type { LlmChatMessage, LlmRole } from '../llm/llm.types';
import type { PromptComposeInput, PromptComposeOutput } from './prompt.types';

@Injectable()
export class PromptComposerService {
  /** 注入 LLM 的最近会话条数上限（数据库 Message 按时间从早到晚截断末尾窗口）。 */
  private static readonly MAX_SESSION_MESSAGES = 80;
  private static readonly ALLOWED_ROLES: ReadonlySet<LlmRole> = new Set([
    'system',
    'user',
    'assistant',
    'tool',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userMemoryStore: UserMemoryStore,
  ) {}

  async compose(input: PromptComposeInput): Promise<PromptComposeOutput> {
    const [agentPrompt, userMemory, conversation] = await Promise.all([
      this.loadAgentPrompt(input.sessionId),
      this.userMemoryStore.get(input.userId),
      this.loadRecentConversationMessages(input.sessionId),
    ]);

    const messages: LlmChatMessage[] = [];

    if (agentPrompt) {
      messages.push({
        role: 'system',
        content: `<agent_prompt>\n${agentPrompt}\n</agent_prompt>`,
      });
    }

    if (userMemory) {
      messages.push({
        role: 'system',
        content: `<user_memory>\n${JSON.stringify(userMemory)}\n</user_memory>`,
      });
    }

    if (conversation.length > 0) {
      messages.push({
        role: 'system',
        content:
          '<session_history>Below are prior messages for this chat session (chronological). Use them as working memory.</session_history>',
      });
      for (const turn of conversation) {
        messages.push(turn);
      }
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

  private isLlmRole(value: string): value is LlmRole {
    return PromptComposerService.ALLOWED_ROLES.has(value as LlmRole);
  }

  /** 从数据库读取最近会话消息，作为 agent / 闲聊 的上下文记忆。 */
  private async loadRecentConversationMessages(
    sessionId: string,
  ): Promise<LlmChatMessage[]> {
    const rows = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: PromptComposerService.MAX_SESSION_MESSAGES,
      select: {
        role: true,
        content: true,
        toolName: true,
        toolInput: true,
        toolOutput: true,
      },
    });
    rows.reverse();
    const out: LlmChatMessage[] = [];
    for (const row of rows) {
      if (!this.isLlmRole(row.role)) {
        continue;
      }
      const text = this.formatPersistedMessageBody(row);
      if (!text.trim()) {
        continue;
      }
      out.push({ role: row.role, content: text });
    }
    return out;
  }

  private formatPersistedMessageBody(row: {
    role: string;
    content: string | null;
    toolName: string | null;
    toolInput: Prisma.JsonValue | null;
    toolOutput: Prisma.JsonValue | null;
  }): string {
    if (row.role === 'tool') {
      const name = row.toolName ?? 'tool';
      const input =
        row.toolInput !== null && row.toolInput !== undefined
          ? JSON.stringify(row.toolInput)
          : '';
      const output =
        row.toolOutput !== null && row.toolOutput !== undefined
          ? JSON.stringify(row.toolOutput)
          : '';
      const head = row.content?.trim() ?? '';
      const parts = [
        head || `[tool ${name}]`,
        input ? `args: ${input}` : null,
        output ? `result: ${output}` : null,
      ].filter((p): p is string => p != null && p.length > 0);
      return parts.join('\n');
    }
    return row.content?.trim() ?? '';
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
