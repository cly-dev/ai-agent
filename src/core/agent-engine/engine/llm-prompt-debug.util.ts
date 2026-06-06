import * as fs from 'node:fs';
import * as path from 'node:path';
import type { LlmChatMessage } from '../../llm/llm.types';
import {
  estimateMessageTokens,
  estimateMessagesTokens,
} from '../../llm/message-token-budget.util';

export type LlmPromptDebugPhase =
  | 'decision'
  | 'summarize'
  | 'precheck'
  | 'intent'
  | 'other';

export type LlmPromptDebugRecord = {
  runId: number;
  sessionId: string;
  phase: LlmPromptDebugPhase;
  step?: number;
  iteration?: number;
  messageTokenBudget?: number;
  estimatedTokens: number;
  writtenAt: string;
  meta?: Record<string, unknown>;
  messages: Array<{
    index: number;
    role: string;
    estimatedTokens: number;
    content: string;
    toolCallId?: string;
  }>;
};

/** 非 production 默认开启；production 需 AGENT_ENGINE_DEBUG=1；AGENT_ENGINE_DEBUG=0 可关闭。 */
export function isLlmPromptDebugEnabled(): boolean {
  const value = process.env.AGENT_ENGINE_DEBUG?.trim().toLowerCase();
  if (value === '0' || value === 'false' || value === 'off') {
    return false;
  }
  if (value === '1' || value === 'true' || value === 'on') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

function buildLlmPromptDebugRecord(input: {
  runId: number;
  sessionId: string;
  phase: LlmPromptDebugPhase;
  step?: number;
  iteration?: number;
  messageTokenBudget?: number;
  meta?: Record<string, unknown>;
  messages: Array<{ role: string; content: string; toolCallId?: string } | LlmChatMessage>;
}): LlmPromptDebugRecord {
  const normalized: LlmChatMessage[] = input.messages.map((message) => ({
    role: message.role as LlmChatMessage['role'],
    content: message.content,
    toolCallId:
      'toolCallId' in message && typeof message.toolCallId === 'string'
        ? message.toolCallId
        : undefined,
  }));

  return {
    runId: input.runId,
    sessionId: input.sessionId,
    phase: input.phase,
    step: input.step,
    iteration: input.iteration,
    messageTokenBudget: input.messageTokenBudget,
    estimatedTokens: estimateMessagesTokens(normalized),
    writtenAt: new Date().toISOString(),
    meta: input.meta,
    messages: normalized.map((message, index) => ({
      index,
      role: message.role,
      estimatedTokens: estimateMessageTokens(message),
      content: message.content,
      ...(message.toolCallId ? { toolCallId: message.toolCallId } : {}),
    })),
  };
}

export function formatLlmPromptDebugForConsole(record: LlmPromptDebugRecord): string {
  const header = [
    '',
    '═'.repeat(72),
    `LLM PROMPT  phase=${record.phase}  runId=${record.runId}  step=${record.step ?? '-'}  iteration=${record.iteration ?? '-'}`,
    `sessionId=${record.sessionId}  estimatedTokens≈${record.estimatedTokens}  budget=${record.messageTokenBudget ?? '-'}`,
    '═'.repeat(72),
  ].join('\n');

  const body = record.messages
    .map(
      (message) =>
        `\n── message[${message.index}] role=${message.role} tokens≈${message.estimatedTokens} ──\n${message.content}`,
    )
    .join('\n');

  return `${header}${body}\n${'═'.repeat(72)}\n`;
}

/** 控制台打印 + 可选写入 logs/agent-engine/prompt/*.json */
export function emitLlmPromptDebug(
  log: (message: string) => void,
  input: {
    runId: number;
    sessionId: string;
    phase: LlmPromptDebugPhase;
    step?: number;
    iteration?: number;
    messageTokenBudget?: number;
    meta?: Record<string, unknown>;
    messages: Array<{ role: string; content: string; toolCallId?: string } | LlmChatMessage>;
  },
): string | null {
  if (!isLlmPromptDebugEnabled()) {
    return null;
  }

  const record = buildLlmPromptDebugRecord(input);
  log(formatLlmPromptDebugForConsole(record));

  try {
    const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'prompt');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(
      dir,
      `run-${input.runId}-step-${input.step ?? 0}-${input.phase}-${Date.now()}.json`,
    );
    fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
    return file;
  } catch {
    return null;
  }
}

/** @deprecated use emitLlmPromptDebug */
export function isLlmPromptDebugFileEnabled(): boolean {
  return isLlmPromptDebugEnabled();
}

/** @deprecated use emitLlmPromptDebug */
export function writeLlmPromptDebugFile(input: {
  runId: number;
  sessionId: string;
  phase: LlmPromptDebugPhase;
  step?: number;
  iteration?: number;
  messageTokenBudget?: number;
  meta?: Record<string, unknown>;
  messages: Array<{ role: string; content: string; toolCallId?: string } | LlmChatMessage>;
}): string | null {
  return emitLlmPromptDebug(() => {}, input);
}
