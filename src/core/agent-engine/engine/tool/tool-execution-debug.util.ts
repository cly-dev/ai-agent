import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ToolHttpRequestLayout } from '../../../tool-engine/tool-http-request-layout.util';
import { isFileDebugLogEnabled } from '../../../security/file-debug-log.util';
import { isLlmPromptDebugEnabled } from '../llm-prompt-debug.util';

export type ToolExecutionDebugRecord = {
  runId?: number;
  sessionId?: string;
  toolName: string;
  step: number;
  iteration: number;
  latencyMs: number;
  executionStatus: string;
  llmArguments: Record<string, unknown>;
  executedInput: Record<string, unknown>;
  httpRequest?: ToolHttpRequestLayout;
  responseSource?: unknown;
  rawOutput: unknown;
  observationOutput?: unknown;
  writtenAt: string;
};

/** 与 LLM prompt debug 共用 AGENT_ENGINE_DEBUG / 非 production 默认开启。 */
export function isToolExecutionDebugEnabled(): boolean {
  return isLlmPromptDebugEnabled();
}

export function serializeAgentRunStepPayload(
  value: unknown,
): Record<string, unknown> | string {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

function truncateJson(value: unknown, maxLen = 4_000): string {
  let text: string;
  try {
    text = JSON.stringify(value);
  } catch {
    text = String(value);
  }
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen)}…[truncated len=${text.length}]`;
}

export function formatToolExecutionDebugForConsole(
  record: ToolExecutionDebugRecord,
): string {
  const header = [
    '',
    '─'.repeat(72),
    `TOOL EXEC  tool=${record.toolName}  runId=${record.runId ?? '-'}  step=${record.step}  iteration=${record.iteration}`,
    `sessionId=${record.sessionId ?? '-'}  status=${record.executionStatus}  latencyMs=${record.latencyMs}`,
    '─'.repeat(72),
  ].join('\n');

  const httpSection = record.httpRequest
    ? [
        `HTTP ${record.httpRequest.method} ${record.httpRequest.resolvedPath}`,
        `pathTemplate: ${record.httpRequest.pathTemplate}`,
        `url: ${record.httpRequest.url}`,
        `parameters.header:\n${truncateJson(record.httpRequest.parameters.header)}`,
        `parameters.path:\n${truncateJson(record.httpRequest.parameters.path)}`,
        `parameters.query:\n${truncateJson(record.httpRequest.parameters.query)}`,
        `parameters.body:\n${truncateJson(record.httpRequest.parameters.body)}`,
        record.httpRequest.bodyJson
          ? `bodyJson:\n${truncateJson(record.httpRequest.bodyJson)}`
          : null,
      ]
        .filter((line): line is string => line != null)
        .join('\n')
    : null;

  const responseSection =
    record.responseSource !== undefined
      ? `Response source:\n${truncateJson(record.responseSource)}`
      : null;

  const body = [
    httpSection ? `HTTP request:\n${httpSection}` : null,
    responseSection,
    `LLM arguments:\n${truncateJson(record.llmArguments)}`,
    `Executed input:\n${truncateJson(record.executedInput)}`,
    `Raw output:\n${truncateJson(record.rawOutput)}`,
    record.observationOutput !== undefined
      ? `Observation output:\n${truncateJson(record.observationOutput)}`
      : null,
  ]
    .filter((line): line is string => line != null)
    .join('\n\n');

  return `${header}\n${body}\n${'─'.repeat(72)}\n`;
}

/** 控制台打印 + 可选写入 logs/agent-engine/tool/*.json */
export function emitToolExecutionDebug(
  log: (message: string) => void,
  input: Omit<ToolExecutionDebugRecord, 'writtenAt'>,
): string | null {
  if (!isToolExecutionDebugEnabled()) {
    return null;
  }

  const record: ToolExecutionDebugRecord = {
    ...input,
    writtenAt: new Date().toISOString(),
  };
  log(formatToolExecutionDebugForConsole(record));

  if (!isFileDebugLogEnabled()) {
    return null;
  }

  try {
    const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'tool');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(
      dir,
      `run-${input.runId ?? 0}-step-${input.step}-${input.toolName}-${Date.now()}.json`,
    );
    fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
    return file;
  } catch {
    return null;
  }
}
