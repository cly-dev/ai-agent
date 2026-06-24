import type { Request } from 'express';

const ADMIN_PREFIX = '/admin';

export function isUnderAdminUrlPath(req: Request): boolean {
  const path = req.path;
  return path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
}

export function isPublicAdminAuthRoute(req: Request): boolean {
  if (req.method !== 'POST') {
    return false;
  }
  const path = req.path.replace(/\/+$/, '') || '/';
  return path === `${ADMIN_PREFIX}/admin-user/login`;
}
