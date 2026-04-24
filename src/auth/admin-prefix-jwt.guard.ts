import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import type { AdminRole } from '../../generated/prisma/client';

type JwtUser = {
  userId?: number;
  email?: string;
  username?: string;
  adminRole?: AdminRole;
};

const ADMIN_PREFIX = '/admin';

function isUnderAdminUrlPath(req: Request): boolean {
  const path = req.path;
  return path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
}

function isPublicAdminAuthRoute(req: Request): boolean {
  if (req.method !== 'POST') {
    return false;
  }
  const path = req.path.replace(/\/+$/, '') || '/';
  return path === `${ADMIN_PREFIX}/admin-user/login`;
}

/**
 * 仅对 URL 路径在 `/admin` 下的请求校验 JWT，且要求 payload 含 {@link AdminRole}（管理员签发）。
 * 未带 `admin` 全局前缀的路由（如 `/chat`、`/user/login`）不经过此守卫的鉴权逻辑。
 */
@Injectable()
export class AdminPrefixJwtGuard extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!isUnderAdminUrlPath(request) || isPublicAdminAuthRoute(request)) {
      return true;
    }
    return super.canActivate(context) as Promise<boolean> | Observable<boolean>;
  }

  override handleRequest<TUser = JwtUser>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<Request>();
    if (!isUnderAdminUrlPath(request) || isPublicAdminAuthRoute(request)) {
      return user as TUser;
    }
    const resolved = super.handleRequest(err, user, info, context) as JwtUser;
    if (resolved.adminRole === undefined) {
      throw new ForbiddenException('administrator access required');
    }
    return resolved as TUser;
  }
}
