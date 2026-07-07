import { createHash } from 'crypto';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import { PageActionRunStatus } from '../../../generated/prisma/client';

/** 占用执行资源的 run 状态：同 key 下不允许并存。 */
export const PAGE_ACTION_ACTIVE_RUN_STATUSES = [
  PageActionRunStatus.running,
  PageActionRunStatus.awaiting_approval,
] as const;

/** 算法版本；变更 hash 输入时递增，避免与历史 run 的 key 语义混淆。 */
const PAGE_ACTION_KEY_VERSION = 2;

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(row).sort()) {
      sorted[key] = sortKeysDeep(row[key]);
    }
    return sorted;
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function digestText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type ComputePageActionKeyInput = {
  actionKey: string;
  pageContext: AgentChatPageContext | null;
  instruction?: string | null;
  context?: Record<string, unknown> | null;
};

/**
 * 从 PageAction invoke 输入生成稳定去重键（sha256 hex）。
 * 对归一化后的 pageContext 整包做稳定 JSON 序列化后 hash，无字段白名单。
 */
export function computePageActionKey(input: ComputePageActionKeyInput): string {
  const actionKey = input.actionKey.trim();
  const instruction = pickString(input.instruction ?? null);
  const pageContext =
    input.pageContext != null ? sortKeysDeep(input.pageContext) : null;
  const context =
    input.context && Object.keys(input.context).length > 0
      ? sortKeysDeep(input.context)
      : null;

  const payload = {
    v: PAGE_ACTION_KEY_VERSION,
    actionKey,
    ...(pageContext ? { pageContext } : {}),
    ...(instruction ? { instruction } : {}),
    ...(context ? { context } : {}),
  };

  return digestText(stableStringify(payload));
}
