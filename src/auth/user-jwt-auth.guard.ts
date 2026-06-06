import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserStatus, type AdminRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type JwtUser = {
  userId?: number;
  email?: string;
  username?: string;
  adminRole?: AdminRole;
};

/**
 * C 端用户 JWT：与 {@link JwtAuthGuard} 相同校验签名，但拒绝管理员签发的 token（payload 含 adminRole）。
 * 禁用账号（User.status=DISABLED）无法访问 C 端接口。
 */
@Injectable()
export class UserJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) {
      return false;
    }
    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = req.user;
    if (user?.adminRole !== undefined) {
      throw new ForbiddenException('admin token cannot access user-only routes');
    }
    if (!user?.userId) {
      throw new UnauthorizedException('invalid user token');
    }
    const row = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { status: true },
    });
    if (!row || row.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('user account is disabled');
    }
    return true;
  }
}
