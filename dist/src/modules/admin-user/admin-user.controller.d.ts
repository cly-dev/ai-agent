import type { Request } from 'express';
import { AdminRole } from '../../../generated/prisma/client';
import { AdminUserService } from './admin-user.service';
import { AdminUserProfileDto } from './dto/admin-user-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { LoginAdminUserDto } from './dto/login-admin-user.dto';
import { QueryAdminUserDto } from './dto/query-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
type AdminAuthedRequest = Request & {
    user?: {
        userId?: number;
        adminRole?: AdminRole;
    };
};
export declare class AdminUserController {
    private readonly service;
    constructor(service: AdminUserService);
    private actor;
    login(body: LoginAdminUserDto): Promise<{
        accessToken: string;
        user: {
            role: AdminRole;
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
    getMe(req: AdminAuthedRequest): Promise<AdminUserProfileDto>;
    changePassword(req: AdminAuthedRequest, body: ChangeAdminPasswordDto): Promise<{
        ok: true;
    }>;
    findPage(req: AdminAuthedRequest, query: QueryAdminUserDto): Promise<import("../../common/pagination").PaginatedResult<import("./admin-user.types").AdminUserResponse>>;
    create(req: AdminAuthedRequest, body: CreateAdminUserDto): Promise<{
        admin: import("./admin-user.types").AdminUserResponse;
        generatedPassword: string;
    }>;
    findOne(req: AdminAuthedRequest, id: number): Promise<import("./admin-user.types").AdminUserResponse>;
    update(req: AdminAuthedRequest, id: number, body: UpdateAdminUserDto): Promise<import("./admin-user.types").AdminUserResponse>;
    resetPassword(req: AdminAuthedRequest, id: number): Promise<{
        admin: import("./admin-user.types").AdminUserResponse;
        generatedPassword: string;
    }>;
}
export {};
