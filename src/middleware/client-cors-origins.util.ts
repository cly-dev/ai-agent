import { isProductionRuntime } from '../core/security/runtime-env.util';

function parseClientCorsOrigins(): string[] {
  const raw = process.env.CLIENT_CORS_ORIGINS?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

let cachedOrigins: string[] | null = null;

export function getClientCorsAllowlist(): string[] {
  if (cachedOrigins === null) {
    cachedOrigins = parseClientCorsOrigins();
  }
  return cachedOrigins;
}

/** 开发环境未配置白名单时，为本地调试反射 Origin。 */
export function shouldReflectClientCorsOrigin(): boolean {
  if (getClientCorsAllowlist().length > 0) {
    return false;
  }
  return !isProductionRuntime();
}

export function resolveAllowedClientCorsOrigin(
  origin: string | undefined,
): string | null {
  if (typeof origin !== 'string' || origin.trim().length === 0) {
    return null;
  }
  const normalized = origin.trim();
  const allowlist = getClientCorsAllowlist();
  if (allowlist.length > 0) {
    return allowlist.includes(normalized) ? normalized : null;
  }
  if (shouldReflectClientCorsOrigin()) {
    return normalized;
  }
  return null;
}
