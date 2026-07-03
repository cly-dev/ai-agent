import type { AdminRole } from '../../../generated/prisma/client';

/** B 端管理员列表/详情响应（不含 password）。 */
export type AdminUserResponse = {
  id: number;
  email: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
};
