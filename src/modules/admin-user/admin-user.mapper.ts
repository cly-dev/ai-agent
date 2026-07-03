import type { AdminUser } from '../../../generated/prisma/client';
import type { AdminUserResponse } from './admin-user.types';

export function toAdminUserResponse(
  user: Omit<AdminUser, 'password'>,
): AdminUserResponse {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
