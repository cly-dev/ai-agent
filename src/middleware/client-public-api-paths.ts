import { RequestMethod } from '@nestjs/common';

/** C 端对外 API：与 main.ts globalPrefix exclude 保持一致；新增 C 端路由须在此登记。 */
export type ClientPublicApiRoute = {
  path: string;
  method: RequestMethod;
};

export const CLIENT_PUBLIC_API_EXCLUDES: ClientPublicApiRoute[] = [
  { path: 'chat', method: RequestMethod.ALL },
  { path: 'chat/(.*)', method: RequestMethod.ALL },
  { path: 'user/login', method: RequestMethod.POST },
  { path: 'user/password-reminder', method: RequestMethod.GET },
  { path: 'app-client/auth', method: RequestMethod.POST },
  { path: 'agent/client/list', method: RequestMethod.GET },
  { path: 'agent/client/available', method: RequestMethod.GET },
  { path: 'agent/:agentId/skills/client', method: RequestMethod.GET },
  { path: 'host-tool/client/catalog', method: RequestMethod.GET },
  { path: 'host-tool/client/register', method: RequestMethod.POST },
  { path: 'page-action/invoke', method: RequestMethod.POST },
  {
    path: 'page-agent/compatible-mode/v1/chat/completions',
    method: RequestMethod.POST,
  },
  { path: 'approval', method: RequestMethod.ALL },
  { path: 'approval/(.*)', method: RequestMethod.ALL },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nestExcludePathToRegex(nestPath: string): RegExp {
  if (nestPath.endsWith('(.*)')) {
    const base = nestPath.slice(0, -'(.*)'.length).replace(/\/$/, '');
    const basePattern = base
      .split('/')
      .filter(Boolean)
      .map((segment) =>
        segment.startsWith(':') ? '[^/]+' : escapeRegex(segment),
      )
      .join('/');
    return new RegExp(`^/${basePattern}(/.*)?$`);
  }

  const pattern = nestPath
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith(':') ? '[^/]+' : escapeRegex(segment),
    )
    .join('/');
  return new RegExp(`^/${pattern}$`);
}

const CLIENT_PUBLIC_API_PATH_REGEXES = CLIENT_PUBLIC_API_EXCLUDES.map(
  (route) => nestExcludePathToRegex(route.path),
);

export function normalizeRequestPath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

/** 去掉误带的 `/admin` 前缀，便于 CORS 与路由 exclude 共用同一套 path 规则。 */
export function stripAdminPrefix(path: string): string {
  const normalized = normalizeRequestPath(path);
  if (normalized === '/admin') {
    return '/';
  }
  if (normalized.startsWith('/admin/')) {
    return normalized.slice('/admin'.length) || '/';
  }
  return normalized;
}

export function matchesClientPublicApiPath(path: string): boolean {
  const normalized = stripAdminPrefix(path);
  return CLIENT_PUBLIC_API_PATH_REGEXES.some((pattern) =>
    pattern.test(normalized),
  );
}
