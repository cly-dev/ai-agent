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
            role: import("../../../generated/prisma/enums").AdminRole;
            id: number;
            email: string;
            username: string;
            mustChangePassword: boolean;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
        };
        mustChangePassword: boolean;
    }>;
    getMe(req: Request & {
        user?: {
            userId?: number;
        };
    }): Promise<AdminUserProfileDto>;
}
