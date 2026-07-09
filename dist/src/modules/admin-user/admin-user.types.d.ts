import type { AdminRole } from '../../../generated/prisma/client';
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
