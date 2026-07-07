import { AdminRole } from '../../../../generated/prisma/client';
export declare class UpdateAdminUserDto {
    email?: string;
    username?: string;
    password?: string;
    role?: AdminRole;
    isActive?: boolean;
}
