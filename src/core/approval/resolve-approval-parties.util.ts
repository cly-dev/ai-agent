import type { ApprovalSource } from '../../../generated/prisma/client';

/** 触发绑定上的可选审批人覆盖（如 PageAction.config.approverUserId）。 */
export type ApprovalTriggerBinding = {
  approverUserId?: number | null;
};

export type ResolveApprovalPartiesInput = {
  source: ApprovalSource;
  initiatorUserId: number | null;
  triggerBinding?: ApprovalTriggerBinding | null;
  /** webhook 必填；chat/pageAction 忽略。 */
  webhookApproverUserId?: number | null;
};

export type ResolvedApprovalParties = {
  initiatorUserId: number | null;
  approverUserId: number;
};

export type ResolveApprovalPartiesError =
  | 'missing_initiator'
  | 'missing_webhook_approver'
  | 'invalid_approver_override';

export type ResolveApprovalPartiesResult =
  | { ok: true; parties: ResolvedApprovalParties }
  | { ok: false; code: ResolveApprovalPartiesError };

function isPositiveUserId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** 从 PageAction / 触发实体 config JSON 读取可选 approverUserId。 */
export function parseApprovalTriggerBinding(
  config: unknown,
): ApprovalTriggerBinding | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return null;
  }
  const raw = (config as Record<string, unknown>).approverUserId;
  if (raw === undefined || raw === null) {
    return null;
  }
  if (!isPositiveUserId(raw)) {
    return null;
  }
  return { approverUserId: raw };
}

/**
 * 按触发通道解析 initiator / approver：
 * - chat / page_action：默认 approver = initiator；可选 triggerBinding 覆盖
 * - webhook：initiator 为空，approver 取自 webhook 配置
 */
export function resolveApprovalParties(
  input: ResolveApprovalPartiesInput,
): ResolveApprovalPartiesResult {
  if (input.source === 'webhook') {
    if (!isPositiveUserId(input.webhookApproverUserId)) {
      return { ok: false, code: 'missing_webhook_approver' };
    }
    return {
      ok: true,
      parties: {
        initiatorUserId: null,
        approverUserId: input.webhookApproverUserId,
      },
    };
  }

  if (!isPositiveUserId(input.initiatorUserId)) {
    return { ok: false, code: 'missing_initiator' };
  }

  const override = input.triggerBinding?.approverUserId;
  if (override != null && !isPositiveUserId(override)) {
    return { ok: false, code: 'invalid_approver_override' };
  }

  return {
    ok: true,
    parties: {
      initiatorUserId: input.initiatorUserId,
      approverUserId: override ?? input.initiatorUserId,
    },
  };
}
