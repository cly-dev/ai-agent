import { AdminRole } from '../../../../generated/prisma/client';
export declare class AdminUserProfileDto {
    id: number;
    employeeId: string;
    email: string;
    username: string;
    nickName: string;
    role: AdminRole;
    active: boolean;
    mustChangePassword: boolean;
}
