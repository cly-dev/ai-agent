import { isProductionRuntime } from '../core/security/runtime-env.util';

function parseCorsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS?.trim() ||
    process.env.CLIENT_CORS_ORIGINS?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

let cachedOrigins: string[] | null = null;

export function getCorsAllowlist(): string[] {
  if (cachedOrigins === null) {
    cachedOrigins = parseCorsOrigins();
  }
  return cachedOrigins;
}

/** @deprecated 使用 getCorsAllowlist */
export const getClientCorsAllowlist = getCorsAllowlist;

/** 开发环境未配置白名单时，为本地调试反射 Origin。 */
export function shouldReflectCorsOrigin(): boolean {
  if (getCorsAllowlist().length > 0) {
    return false;
  }
  return !isProductionRuntime();
}

/** @deprecated 使用 shouldReflectCorsOrigin */
export const shouldReflectClientCorsOrigin = shouldReflectCorsOrigin;

export function resolveAllowedCorsOrigin(
  origin: string | undefined,
): string | null {
  if (typeof origin !== 'string' || origin.trim().length === 0) {
    return null;
  }
  const normalized = origin.trim();
  const allowlist = getCorsAllowlist();
  if (allowlist.length > 0) {
    return allowlist.includes(normalized) ? normalized : null;
  }
  if (shouldReflectCorsOrigin()) {
    return normalized;
  }
  return null;
}

/** @deprecated 使用 resolveAllowedCorsOrigin */
export const resolveAllowedClientCorsOrigin = resolveAllowedCorsOrigin;
