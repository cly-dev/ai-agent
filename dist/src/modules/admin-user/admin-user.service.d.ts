import { JwtService } from '@nestjs/jwt';
import type { AdminUser } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginAdminUserDto } from './dto/login-admin-user.dto';
import type { AdminUserProfileDto } from './dto/admin-user-profile.dto';
export declare class AdminUserService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private verifyPassword;
    private sanitizeAdminUser;
    toExternalProfile(user: Omit<AdminUser, 'password'>): AdminUserProfileDto;
    getProfileByUserId(userId: number): Promise<AdminUserProfileDto>;
    login(data: LoginAdminUserDto): Promise<{
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
}
