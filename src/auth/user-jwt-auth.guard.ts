import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AdminRole } from '../../generated/prisma/client';

type JwtUser = {
  userId?: number;
  email?: string;
  username?: string;
  adminRole?: AdminRole;
};

/**
 * C 端用户 JWT：与 {@link JwtAuthGuard} 相同校验签名，但拒绝管理员签发的 token（payload 含 adminRole）。
 */
@Injectable()
export class UserJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = JwtUser>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const resolved = super.handleRequest(err, user, info, context) as JwtUser;
    if (resolved?.adminRole !== undefined) {
      throw new ForbiddenException('admin token cannot access user-only routes');
    }
    return resolved as TUser;
  }
}
