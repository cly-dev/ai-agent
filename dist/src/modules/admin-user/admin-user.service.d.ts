import { JwtService } from '@nestjs/jwt';
import { AdminRole, type AdminUser } from '../../../generated/prisma/client';
import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminUserResponse } from './admin-user.types';
import type { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import type { CreateAdminUserDto } from './dto/create-admin-user.dto';
import type { LoginAdminUserDto } from './dto/login-admin-user.dto';
import type { AdminUserProfileDto } from './dto/admin-user-profile.dto';
import type { QueryAdminUserDto } from './dto/query-admin-user.dto';
import type { UpdateAdminUserDto } from './dto/update-admin-user.dto';
export declare class AdminUserService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private hashPassword;
    private generateInitialPassword;
    private verifyPassword;
    private sanitizeAdminUser;
    private assertSuperAdmin;
    private assertLastSuperAdminPreserved;
    toExternalProfile(user: Omit<AdminUser, 'password'>): AdminUserProfileDto;
    getProfileByUserId(userId: number): Promise<AdminUserProfileDto>;
    create(dto: CreateAdminUserDto, actorRole: AdminRole | undefined): Promise<{
        admin: AdminUserResponse;
        generatedPassword: string;
    }>;
    findPage(query: QueryAdminUserDto, actorRole: AdminRole | undefined): Promise<PaginatedResult<AdminUserResponse>>;
    findOne(id: number, actorRole: AdminRole | undefined): Promise<AdminUserResponse>;
    update(id: number, dto: UpdateAdminUserDto, actor: {
        userId: number;
        adminRole: AdminRole | undefined;
    }): Promise<AdminUserResponse>;
    resetPassword(id: number, actorRole: AdminRole | undefined): Promise<{
        admin: AdminUserResponse;
        generatedPassword: string;
    }>;
    changePassword(userId: number, dto: ChangeAdminPasswordDto): Promise<{
        ok: true;
    }>;
    login(data: LoginAdminUserDto): Promise<{
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
    private buildWhere;
    private buildOrderBy;
}
