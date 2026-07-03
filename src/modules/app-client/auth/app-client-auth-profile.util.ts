import { createHash } from 'crypto';
import type { ExternalAccountProfile } from '../../user/user.service';

function sanitizeIdentitySegment(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const sanitized = trimmed
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'user';
}

export function tokenIdentityDigest(accountToken: string): string {
  return createHash('sha256')
    .update(accountToken.trim())
    .digest('hex')
    .slice(0, 24);
}

/**
 * 将可选映射字段规范为建档所需的 ExternalAccountProfile。
 * token 已通过外部校验时，缺省字段用 employeeId / token 摘要合成。
 */
export function normalizeExternalAccountProfile(
  partial: Partial<ExternalAccountProfile> & { active?: boolean },
  input: { appClientId: number; accountToken: string },
): ExternalAccountProfile {
  const tokenDigest = tokenIdentityDigest(input.accountToken);
  const employeeId =
    partial.employeeId?.trim() ||
    partial.username?.trim() ||
    `tok_${tokenDigest}`;
  const username =
    partial.nickName?.trim() ||
    partial.cnName?.trim() ||
    partial.username?.trim() ||
    employeeId;
  const email =
    partial.email?.trim() ||
    `${sanitizeIdentitySegment(employeeId)}@app-${input.appClientId}.ext.agent.local`;

  return {
    employeeId,
    email,
    username,
    nickName: partial.nickName?.trim(),
    cnName: partial.cnName?.trim(),
    active: partial.active !== false,
  };
}
