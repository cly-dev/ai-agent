import type { AdminUser } from '../../../generated/prisma/client';
import type { AdminUserResponse } from './admin-user.types';
export declare function toAdminUserResponse(user: Omit<AdminUser, 'password'>): AdminUserResponse;
