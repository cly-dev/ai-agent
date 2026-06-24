import * as fs from 'node:fs';
import * as path from 'node:path';
import { isFileDebugLogEnabled } from '../../../security/file-debug-log.util';
import { isLlmPromptDebugEnabled } from '../llm-prompt-debug.util';
import { serializeMessageBlocksForStorage } from './message-blocks.util';
import type { MessageBlock } from './message-blocks.types';

/** 与 LLM / tool debug 共用 AGENT_ENGINE_DEBUG。 */
export function isMessageBlocksDebugEnabled(): boolean {
  return isLlmPromptDebugEnabled();
}

export type AgentMessageSseDebugRecord = {
  writtenAt: string;
  tag: string;
  sessionId: string;
  runId?: number;
  turnId?: number;
  /** 实际推送给前端的 SSE message 事件（与 ChatEventsService.emit 入参一致） */
  sseEvent: {
    event: 'message';
    payload: Record<string, unknown>;
  };
  /** 产生该 SSE 的源数据（入参 blocks、artifact、落库串等） */
  source: Record<string, unknown>;
};

export type AgentMessagePersistDebugRecord = {
  writtenAt: string;
  tag: string;
  sessionId: string;
  runId: number;
  turnId: number;
  messageId?: number;
  /** 写入 DB 的 content 原文 */
  dbContent: string;
  source: Record<string, unknown>;
};

function resolveMessageBlocksDebugLogFile(input: {
  runId?: number;
  sessionId?: string;
}): string {
  const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'message-blocks');
  if (input.runId != null) {
    return path.join(dir, `run-${input.runId}.log`);
  }
  if (input.sessionId) {
    return path.join(dir, `session-${input.sessionId}.log`);
  }
  return path.join(dir, 'misc.log');
}

function truncateJson(value: unknown, maxLen = 24_000): string {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen)}\n…[truncated totalLen=${text.length}]`;
}

function appendDebugBlock(file: string, header: string, body: string): void {
  const block = [
    '',
    '─'.repeat(72),
    header,
    '─'.repeat(72),
    body,
    '',
  ].join('\n');
  fs.appendFileSync(file, block, 'utf-8');
}

/** 记录 SSE message 推送内容与源数据。 */
export function emitAgentMessageSseDebug(input: {
  tag: string;
  sessionId: string;
  runId?: number;
  turnId?: number;
  ssePayload: Record<string, unknown>;
  source: Record<string, unknown>;
}): string | null {
  if (!isMessageBlocksDebugEnabled()) {
    return null;
  }
  if (!isFileDebugLogEnabled()) {
    return null;
  }
  const record: AgentMessageSseDebugRecord = {
    writtenAt: new Date().toISOString(),
    tag: input.tag,
    sessionId: input.sessionId,
    runId: input.runId,
    turnId: input.turnId,
    sseEvent: { event: 'message', payload: input.ssePayload },
    source: input.source,
  };
  try {
    const file = resolveMessageBlocksDebugLogFile(input);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const header = [
      `SSE message  tag=${input.tag}`,
      `sessionId=${input.sessionId}`,
      input.runId != null ? `runId=${input.runId}` : null,
      input.turnId != null ? `turnId=${input.turnId}` : null,
      `action=${String(input.ssePayload.action ?? '-')}`,
      input.ssePayload.seq != null ? `seq=${input.ssePayload.seq}` : null,
      input.ssePayload.mode != null ? `mode=${input.ssePayload.mode}` : null,
    ]
      .filter((part): part is string => part != null)
      .join('  ');
    appendDebugBlock(
      file,
      header,
      `sseEvent:\n${truncateJson(record.sseEvent)}\n\nsource:\n${truncateJson(record.source)}`,
    );
    return file;
  } catch {
    return null;
  }
}

/** 记录落库 content 与 artifact 源数据（非 SSE，便于与 message 事件对照）。 */
export function emitAgentMessagePersistDebug(input: {
  tag: string;
  sessionId: string;
  runId: number;
  turnId: number;
  messageId?: number;
  dbContent: string;
  source: Record<string, unknown>;
}): string | null {
  if (!isMessageBlocksDebugEnabled()) {
    return null;
  }
  if (!isFileDebugLogEnabled()) {
    return null;
  }
  try {
    const file = resolveMessageBlocksDebugLogFile(input);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const header = [
      `DB persist  tag=${input.tag}`,
      `sessionId=${input.sessionId}`,
      `runId=${input.runId}`,
      `turnId=${input.turnId}`,
      input.messageId != null ? `messageId=${input.messageId}` : null,
    ]
      .filter((part): part is string => part != null)
      .join('  ');
    appendDebugBlock(
      file,
      header,
      `dbContent:\n${truncateJson(input.dbContent)}\n\nsource:\n${truncateJson(input.source)}`,
    );
    return file;
  } catch {
    return null;
  }
}

export function blocksSourceSnapshot(
  blocks: MessageBlock[],
  options?: { label?: string },
): Record<string, unknown> {
  const serialized = serializeMessageBlocksForStorage(blocks);
  return {
    ...(options?.label ? { label: options.label } : {}),
    blocks,
    storageSerialized: serialized,
  };
}

export function serializedSourceSnapshot(
  serialized: string,
  options?: { label?: string; blocks?: MessageBlock[] },
): Record<string, unknown> {
  return {
    ...(options?.label ? { label: options.label } : {}),
    storageSerialized: serialized,
    ...(options?.blocks ? { blocks: options.blocks } : {}),
  };
}

export function logPersistContentMismatch(input: {
  sessionId: string;
  runId: number;
  turnId: number;
  tag: string;
  artifactSerialized: string;
  priorDbContent: string;
}): void {
  if (
    !isMessageBlocksDebugEnabled() ||
    input.artifactSerialized === input.priorDbContent
  ) {
    return;
  }
  emitAgentMessagePersistDebug({
    tag: `${input.tag}_MISMATCH`,
    sessionId: input.sessionId,
    runId: input.runId,
    turnId: input.turnId,
    dbContent: input.artifactSerialized,
    source: {
      artifactSerialized: input.artifactSerialized,
      priorDbContent: input.priorDbContent,
    },
  });
}
