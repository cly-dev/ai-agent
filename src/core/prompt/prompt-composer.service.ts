import { Injectable } from '@nestjs/common';
import { SessionContextStore } from '../memory/session-context.store';
import { UserMemoryStore } from '../memory/user-memory.store';
import { PrismaService } from '../../prisma/prisma.service';
import type { LlmChatMessage, LlmRole } from '../llm/llm.types';
import type {
  PromptComposeInput,
  PromptComposeOutput,
  SessionContextTurn,
} from './prompt.types';

type SessionContextPayload = {
  turns: SessionContextTurn[];
};

@Injectable()
export class PromptComposerService {
  private static readonly BASE_SYSTEM_PROMPT =
    'You are a helpful AI assistant. Follow safety rules and keep responses concise and correct.';
  private static readonly ALLOWED_ROLES: ReadonlySet<LlmRole> = new Set([
    'system',
    'user',
    'assistant',
    'tool',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userMemoryStore: UserMemoryStore,
    private readonly sessionContextStore: SessionContextStore,
  ) {}

  async compose(input: PromptComposeInput): Promise<PromptComposeOutput> {
    const [agentPrompt, userMemory, sessionContext] = await Promise.all([
      this.loadAgentPrompt(input.sessionId),
      this.userMemoryStore.get(input.userId),
      this.sessionContextStore.get(input.sessionId),
    ]);

    const messages: LlmChatMessage[] = [
      {
        role: 'system',
        content: PromptComposerService.BASE_SYSTEM_PROMPT,
      },
    ];

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

    if (sessionContext && this.isSessionContextPayload(sessionContext)) {
      for (const turn of sessionContext.turns) {
        if (!turn.content) {
          continue;
        }
        if (!this.isLlmRole(turn.role)) {
          continue;
        }
        messages.push({
          role: turn.role,
          content: turn.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: input.latestUserMessage,
    });

    return { messages };
  }

  private isSessionContextPayload(
    value: Record<string, unknown>,
  ): value is SessionContextPayload {
    const turns = value.turns;
    if (!Array.isArray(turns)) {
      return false;
    }
    return turns.every((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }
      const row = item as Record<string, unknown>;
      return (
        typeof row.messageId === 'number' &&
        typeof row.role === 'string' &&
        (typeof row.content === 'string' || row.content === null) &&
        typeof row.createdAt === 'string'
      );
    });
  }

  private isLlmRole(value: string): value is LlmRole {
    return PromptComposerService.ALLOWED_ROLES.has(value as LlmRole);
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
