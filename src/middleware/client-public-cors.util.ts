import type { Request, Response } from 'express';
import { resolveAllowedClientCorsOrigin } from './client-cors-origins.util';
import { matchesClientPublicApiPath } from './client-public-api-paths';

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

export function shouldApplyClientPublicCors(req: Request): boolean {
  return matchesClientPublicApiPath(req.path);
}

/**
 * C 端接口跨域响应头。
 * SSE（EventSource）可能携带 Last-Event-ID；浏览器预检需允许常用鉴权头。
 */
export function applyClientPublicCors(req: Request, res: Response): void {
  const origin = req.headers.origin;
  const allowedOrigin = resolveAllowedClientCorsOrigin(
    typeof origin === 'string' ? origin : undefined,
  );
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (typeof origin !== 'string' || origin.length === 0) {
    // 无 Origin（非浏览器 / same-origin）时不强制 * + credentials
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
