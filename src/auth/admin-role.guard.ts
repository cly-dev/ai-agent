import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AdminRole } from '../../generated/prisma/client';
import { ADMIN_ROLES_KEY } from './admin-roles.decorator';

type RequestUser = {
  userId?: number;
  adminRole?: AdminRole;
};

type RequestWithUser = Request & {
  user?: RequestUser;
};

@Injectable()
export class AdminRoleGuard implements CanActivate {
  private readonly adminRoleWeight: Record<AdminRole, number> = {
    [AdminRole.VIEWER]: 1,
    [AdminRole.OPERATOR]: 2,
    [AdminRole.SUPER_ADMIN]: 3,
  };

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user?.adminRole) {
      throw new UnauthorizedException('admin authentication required');
    }

    const userWeight = this.adminRoleWeight[user.adminRole];
    const minRequiredWeight = requiredRoles.reduce<number>(
      (currentMin, role) => Math.min(currentMin, this.adminRoleWeight[role]),
      Number.POSITIVE_INFINITY,
    );

    if (userWeight < minRequiredWeight) {
      throw new ForbiddenException('insufficient admin permissions');
    }

    return true;
  }
}
