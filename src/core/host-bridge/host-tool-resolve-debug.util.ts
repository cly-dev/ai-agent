import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  isAgentEngineDebugEnabled,
  isFileDebugLogEnabled,
} from '../security/file-debug-log.util';

export type HostToolResolveDebugRecord = {
  component: 'host_tool_resolve';
  stage: string;
  writtenAt: string;
} & Record<string, unknown>;

/** 与 `AGENT_ENGINE_DEBUG` / 非 production 默认开启策略一致（仅控制台）。 */
export function isHostToolResolveDebugEnabled(): boolean {
  return isAgentEngineDebugEnabled();
}

function resolveHostToolResolveLogFile(payload: Record<string, unknown>): string {
  const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'host-tool-resolve');
  const runId = payload.runId;
  if (typeof runId === 'number') {
    return path.join(dir, `run-${runId}.log`);
  }
  const sessionId = payload.sessionId;
  if (typeof sessionId === 'string' && sessionId.trim()) {
    return path.join(dir, `session-${sessionId.trim()}.log`);
  }
  return path.join(dir, 'misc.log');
}

function truncateJson(value: unknown, maxLen = 48_000): string {
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

function appendHostToolResolveBlock(
  file: string,
  stage: string,
  record: HostToolResolveDebugRecord,
): void {
  const header = [
    `HOST TOOL RESOLVE  stage=${stage}`,
    `writtenAt=${record.writtenAt}`,
    record.runId != null ? `runId=${record.runId}` : null,
    record.sessionId != null ? `sessionId=${record.sessionId}` : null,
    record.agentId != null ? `agentId=${record.agentId}` : null,
    record.skillId != null ? `skillId=${record.skillId}` : null,
    record.pageScope != null ? `pageScope=${record.pageScope}` : null,
    record.selectionBranch != null
      ? `selectionBranch=${record.selectionBranch}`
      : null,
    record.toolCount != null ? `toolCount=${record.toolCount}` : null,
  ]
    .filter((part): part is string => part != null)
    .join('  ');

  const block = [
    '',
    '─'.repeat(72),
    header,
    '─'.repeat(72),
    truncateJson(record),
    '',
  ].join('\n');
  fs.appendFileSync(file, block, 'utf-8');
}

/** 写入 logs/agent-engine/host-tool-resolve/run-{runId}.log（无 runId 时按 session / misc 归档）。 */
export function logHostToolResolve(
  stage: string,
  payload: Record<string, unknown>,
): string | null {
  if (!isHostToolResolveDebugEnabled()) {
    return null;
  }
  if (!isFileDebugLogEnabled()) {
    return null;
  }

  const record: HostToolResolveDebugRecord = {
    component: 'host_tool_resolve',
    stage,
    writtenAt: new Date().toISOString(),
    ...payload,
  };

  try {
    const file = resolveHostToolResolveLogFile(payload);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    appendHostToolResolveBlock(file, stage, record);
    return file;
  } catch {
    return null;
  }
}
