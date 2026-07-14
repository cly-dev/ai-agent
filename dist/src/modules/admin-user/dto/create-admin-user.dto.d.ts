import { AdminRole } from '../../../../generated/prisma/client';
export declare class CreateAdminUserDto {
    email: string;
    username: string;
    role: AdminRole;
    isActive?: boolean;
}
