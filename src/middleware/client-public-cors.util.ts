import type { Request, Response } from 'express';

const ADMIN_PREFIX = '/admin';

/** C 端误带 `/admin` 前缀时仍须返回 CORS，否则浏览器只报跨域、看不到真实 404。 */
const MISROUTED_CLIENT_PATHS = new Set([
  '/admin/app-client/auth',
  '/admin/user/login',
  '/admin/user/password-reminder',
  '/admin/host-tool/client/catalog',
  '/admin/host-tool/client/register',
]);

const DEFAULT_ALLOW_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-App-Dsn',
  'X-Account-Token',
  'Accept',
  'Accept-Language',
  'Cache-Control',
  'Last-Event-ID',
].join(', ');

/**
 * 非 `/admin` 前缀的路由视为 C 端对外 API
 * （chat、app-client/auth、agent/client、host-tool/client 等；见 main.ts exclude）。
 */
export function isClientPublicApiPath(path: string): boolean {
  const normalized = path.replace(/\/+$/, '') || '/';
  return (
    normalized !== ADMIN_PREFIX && !normalized.startsWith(`${ADMIN_PREFIX}/`)
  );
}

export function shouldApplyClientPublicCors(req: Request): boolean {
  const normalized = req.path.replace(/\/+$/, '') || '/';
  return isClientPublicApiPath(normalized) || MISROUTED_CLIENT_PATHS.has(normalized);
}

/**
 * C 端接口跨域响应头。
 * SSE（EventSource）可能携带 Last-Event-ID；浏览器预检需允许常用鉴权头。
 */
export function applyClientPublicCors(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // credentials:true 与 Allow-Origin:* 不可同时使用（浏览器会直接判跨域失败）
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  const requestedHeaders = req.headers['access-control-request-headers'];
  if (typeof requestedHeaders === 'string' && requestedHeaders.trim().length > 0) {
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  } else {
    res.setHeader('Access-Control-Allow-Headers', DEFAULT_ALLOW_HEADERS);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleClientPublicCorsPreflight(
  req: Request,
  res: Response,
): boolean {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return true;
  }
  return false;
}
