import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AdminRole } from '../../generated/prisma/client';
import { ADMIN_ROLES_KEY } from './admin-roles.decorator';
import {
  isPublicAdminAuthRoute,
  isUnderAdminUrlPath,
} from './admin-url-path.util';

type RequestUser = {
  userId?: number;
  adminRole?: AdminRole;
};

type RequestWithUser = Request & {
  user?: RequestUser;
};

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class AdminRoleGuard implements CanActivate {
  private readonly adminRoleWeight: Record<AdminRole, number> = {
    [AdminRole.VIEWER]: 1,
    [AdminRole.OPERATOR]: 2,
    [AdminRole.SUPER_ADMIN]: 3,
  };

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!isUnderAdminUrlPath(request) || isPublicAdminAuthRoute(request)) {
      return true;
    }

    const explicitRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles =
      explicitRoles && explicitRoles.length > 0
        ? explicitRoles
        : this.defaultRolesForMethod(request.method);

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

  private defaultRolesForMethod(method: string | undefined): AdminRole[] {
    const normalized = (method ?? 'GET').toUpperCase();
    if (READ_METHODS.has(normalized)) {
      return [AdminRole.VIEWER];
    }
    return [AdminRole.OPERATOR];
  }
}
