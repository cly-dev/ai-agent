import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../generated/prisma/client';

export const ADMIN_ROLES_KEY = 'adminRoles';

export const AdminRoles = (...roles: AdminRole[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
