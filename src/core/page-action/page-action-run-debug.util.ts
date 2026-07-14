import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import type { LlmChatMessage } from '../llm/llm.types';
import {
  estimateMessageTokens,
  estimateMessagesTokens,
} from '../llm/message-token-budget.util';
import {
  isPageActionRunDebugEnabled,
  isPageActionRunFileDebugEnabled,
} from '../security/file-debug-log.util';

const logger = new Logger('PageActionRunDebug');

/** 单条 JSON 文件软上限，超长截断并标注（开发排查类目/prompt 需尽量保留全文）。 */
const MAX_JSON_FILE_CHARS = 2_000_000;

export type PageActionRunDebugStage =
  | 'invoke'
  | 'prompt'
  | 'llm_request'
  | 'llm_response'
  | 'dsl'
  | 'result'
  | 'error';

function sanitizeActionKey(actionKey: string): string {
  return actionKey.trim().replace(/[^a-zA-Z0-9_.-]+/g, '_') || 'action';
}

function resolveRunLogFile(actionRunId: number, actionKey?: string | null): string {
  const dir = path.join(process.cwd(), 'logs', 'page-action');
  fs.mkdirSync(dir, { recursive: true });
  const key = actionKey ? `-${sanitizeActionKey(actionKey)}` : '';
  return path.join(dir, `run-${actionRunId}${key}.log`);
}

function resolvePromptJsonFile(input: {
  actionRunId: number;
  actionKey?: string | null;
  stage: string;
}): string {
  const dir = path.join(process.cwd(), 'logs', 'page-action', 'prompt');
  fs.mkdirSync(dir, { recursive: true });
  const key = input.actionKey ? `-${sanitizeActionKey(input.actionKey)}` : '';
  return path.join(
    dir,
    `run-${input.actionRunId}${key}-${input.stage}-${Date.now()}.json`,
  );
}

function stringifyForLog(value: unknown, maxChars = MAX_JSON_FILE_CHARS): string {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n…[truncated totalLen=${text.length}]`;
}

function normalizePromptMessages(
  messages: Array<{ role: string; content: string; toolCallId?: string } | LlmChatMessage>,
): Array<{
  index: number;
  role: string;
  content: string;
  contentLength: number;
  estimatedTokens: number;
  toolCallId?: string;
}> {
  return messages.map((message, index) => {
    const content = message.content ?? '';
    const toolCallId =
      'toolCallId' in message && typeof message.toolCallId === 'string'
        ? message.toolCallId
        : undefined;
    const normalized: LlmChatMessage = {
      role: message.role as LlmChatMessage['role'],
      content,
      ...(toolCallId ? { toolCallId } : {}),
    };
    return {
      index,
      role: normalized.role,
      content,
      contentLength: content.length,
      estimatedTokens: estimateMessageTokens(normalized),
      ...(toolCallId ? { toolCallId } : {}),
    };
  });
}

function appendRunLogBlock(input: {
  actionRunId: number;
  actionKey?: string | null;
  stage: PageActionRunDebugStage | string;
  record: Record<string, unknown>;
}): string | null {
  if (!isPageActionRunFileDebugEnabled()) {
    return null;
  }
  try {
    const file = resolveRunLogFile(input.actionRunId, input.actionKey);
    const header = [
      `PAGE_ACTION  stage=${input.stage}`,
      `writtenAt=${String(input.record.writtenAt ?? new Date().toISOString())}`,
      `actionRunId=${input.actionRunId}`,
      input.actionKey ? `actionKey=${input.actionKey}` : null,
    ]
      .filter((part): part is string => part != null)
      .join('  ');
    const block = [
      '',
      '─'.repeat(72),
      header,
      '─'.repeat(72),
      stringifyForLog(input.record),
      '',
    ].join('\n');
    fs.appendFileSync(file, block, 'utf-8');
    return file;
  } catch {
    return null;
  }
}

function writePromptJsonFile(input: {
  actionRunId: number;
  actionKey?: string | null;
  stage: string;
  record: Record<string, unknown>;
}): string | null {
  if (!isPageActionRunFileDebugEnabled()) {
    return null;
  }
  try {
    const file = resolvePromptJsonFile({
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      stage: input.stage,
    });
    fs.writeFileSync(file, `${stringifyForLog(input.record)}\n`, 'utf-8');
    return file;
  } catch {
    return null;
  }
}

/**
 * PageAction 运行调试：写入 `logs/page-action/run-{id}*.log`（及 prompt JSON）。
 * 仅非生产环境；`PAGE_ACTION_DEBUG=0` 可关。
 */
export function logPageActionRunDebug(
  stage: PageActionRunDebugStage | string,
  payload: Record<string, unknown> & {
    actionRunId: number;
    actionKey?: string | null;
  },
): string | null {
  if (!isPageActionRunDebugEnabled()) {
    return null;
  }

  const { actionRunId, actionKey, ...rest } = payload;
  const record = {
    component: 'page_action',
    stage,
    writtenAt: new Date().toISOString(),
    actionRunId,
    ...(actionKey ? { actionKey } : {}),
    ...rest,
  };

  const file = appendRunLogBlock({
    actionRunId,
    actionKey,
    stage,
    record,
  });

  if (isPageActionRunDebugEnabled()) {
    const rel = file ? ` → logs/${path.relative(process.cwd(), file)}` : '';
    logger.log(`page_action.${stage} actionRunId=${actionRunId}${rel}`);
  }

  return file;
}

/**
 * 记录送给 LLM 的完整提示词（开发环境）。
 * - 全文 JSON → `logs/page-action/prompt/`
 * - 主 run `.log`：`*_fitted` 等裁剪后 phase 写 messages 全文；其余 phase 只写 preview
 */
export function logPageActionLlmPrompt(input: {
  actionRunId: number;
  actionKey?: string | null;
  phase: string;
  messages: Array<{ role: string; content: string; toolCallId?: string } | LlmChatMessage>;
  meta?: Record<string, unknown>;
}): string | null {
  if (!isPageActionRunDebugEnabled()) {
    return null;
  }

  const normalized = normalizePromptMessages(input.messages);
  const estimatedTokens = estimateMessagesTokens(
    normalized.map((row) => ({
      role: row.role as LlmChatMessage['role'],
      content: row.content,
      toolCallId: row.toolCallId,
    })),
  );

  const record = {
    component: 'page_action',
    stage: 'prompt',
    phase: input.phase,
    writtenAt: new Date().toISOString(),
    actionRunId: input.actionRunId,
    ...(input.actionKey ? { actionKey: input.actionKey } : {}),
    estimatedTokens,
    messageCount: normalized.length,
    ...(input.meta ? { meta: input.meta } : {}),
    messages: normalized,
  };

  const jsonFile = writePromptJsonFile({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    stage: input.phase,
    record,
  });
  const promptJsonRel = jsonFile
    ? path.relative(process.cwd(), jsonFile)
    : null;

  // fit 之后（*_fitted）：主 .log 也落全文，便于直接对照裁剪结果。
  // 其余 phase 仍只写摘要，全文在独立 prompt JSON，避免 initial 把 .log 撑爆。
  const isPostFitPhase = /fitted|after_fit|cropped/i.test(input.phase);
  appendRunLogBlock({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    stage: 'prompt',
    record: {
      ...record,
      messages: isPostFitPhase
        ? normalized
        : normalized.map((row) => ({
            index: row.index,
            role: row.role,
            contentLength: row.contentLength,
            estimatedTokens: row.estimatedTokens,
            contentPreview:
              row.content.length > 400
                ? `${row.content.slice(0, 400)}…`
                : row.content,
          })),
      promptJsonFile: promptJsonRel,
      messagesFullInLog: isPostFitPhase,
    },
  });

  if (jsonFile) {
    logger.log(
      `page_action.prompt phase=${input.phase} actionRunId=${input.actionRunId}` +
        ` messages=${normalized.length} tokens≈${estimatedTokens}` +
        ` → ${promptJsonRel}`,
    );
  }

  return jsonFile;
}

/** LLM 响应 / tool_call 结果落盘（开发环境）。 */
export function logPageActionLlmResponse(input: {
  actionRunId: number;
  actionKey?: string | null;
  phase: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  detail: Record<string, unknown>;
}): string | null {
  return logPageActionRunDebug('llm_response', {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    phase: input.phase,
    model: input.model ?? null,
    promptTokens: input.promptTokens ?? null,
    completionTokens: input.completionTokens ?? null,
    ...input.detail,
  });
}
