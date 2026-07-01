import type { Request } from 'express';
import { AdminUserService } from './admin-user.service';
import { AdminUserProfileDto } from './dto/admin-user-profile.dto';
import { LoginAdminUserDto } from './dto/login-admin-user.dto';
export declare class AdminUserController {
    private readonly service;
    constructor(service: AdminUserService);
    login(body: LoginAdminUserDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            role: import("../../../generated/prisma/enums").AdminRole;
            email: string;
            username: string;
            mustChangePassword: boolean;
        };
        mustChangePassword: boolean;
    }>;
    getMe(req: Request & {
        user?: {
            userId?: number;
        };
    }): Promise<AdminUserProfileDto>;
}
