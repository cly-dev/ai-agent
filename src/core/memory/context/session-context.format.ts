import type { Prisma } from '../../../../generated/prisma/client';
import {
  messageBlocksToPlainText,
  tryParseStoredMessageBlocks,
} from '../../agent-engine/engine/message/message-blocks.util';
import type { LlmChatMessage, LlmRole } from '../../llm/llm.types';
import type { SessionContextTurn } from './session-context.types';

const ALLOWED_ROLES: ReadonlySet<LlmRole> = new Set([
  'system',
  'user',
  'assistant',
  'tool',
]);

function isLlmRole(value: string): value is LlmRole {
  return ALLOWED_ROLES.has(value as LlmRole);
}

export function formatMessageTurnBody(turn: SessionContextTurn): string {
  if (turn.role === 'tool') {
    const name = turn.toolName ?? 'tool';
    const input =
      turn.toolInput !== null && turn.toolInput !== undefined
        ? JSON.stringify(turn.toolInput)
        : '';
    const output =
      turn.toolOutput !== null && turn.toolOutput !== undefined
        ? JSON.stringify(turn.toolOutput)
        : '';
    const head = turn.content?.trim() ?? '';
    const parts = [
      head || `[tool ${name}]`,
      input ? `args: ${input}` : null,
      output ? `result: ${output}` : null,
    ].filter((p): p is string => p != null && p.length > 0);
    return parts.join('\n');
  }
  const raw = turn.content?.trim() ?? '';
  if (turn.role === 'assistant' && raw.startsWith('{')) {
    const blocks = tryParseStoredMessageBlocks(raw);
    if (blocks?.length) {
      const plain = messageBlocksToPlainText(blocks).trim();
      if (plain.length > 0) {
        return plain;
      }
    }
  }
  return raw;
}

export function messageTurnsToLlmMessages(
  turns: SessionContextTurn[],
  maxMessages: number,
): LlmChatMessage[] {
  const window =
    turns.length > maxMessages ? turns.slice(-maxMessages) : turns;
  const out: LlmChatMessage[] = [];
  for (const turn of window) {
    if (!isLlmRole(turn.role)) {
      continue;
    }
    const text = formatMessageTurnBody(turn);
    if (!text.trim()) {
      continue;
    }
    out.push({ role: turn.role, content: text });
  }
  return out;
}

export function dbMessageRowToMessageTurn(row: {
  id: number;
  role: string;
  content: string | null;
  toolName: string | null;
  toolInput: Prisma.JsonValue | null;
  toolOutput: Prisma.JsonValue | null;
  createdAt: Date;
}): SessionContextTurn {
  return {
    messageId: row.id,
    role: row.role,
    content: row.content ?? null,
    toolName: row.toolName ?? null,
    toolInput: row.toolInput ?? null,
    toolOutput: row.toolOutput ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
