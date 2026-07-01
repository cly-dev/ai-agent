import { PrismaService } from '../../prisma/prisma.service';
import type { RequestAppClient } from '../../auth/request-app-client';
import { UserService } from '../user/user.service';
import { CreateAppClientDto } from './dto/create-app-client.dto';
import { UpdateAppClientDto } from './dto/update-app-client.dto';
import { AppClientAuthService } from './auth/app-client-auth.service';
export declare class AppClientService {
    private readonly prisma;
    private readonly userService;
    private readonly appClientAuthService;
    constructor(prisma: PrismaService, userService: UserService, appClientAuthService: AppClientAuthService);
    create(dto: CreateAppClientDto): Promise<{
        id: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    findAll(): Promise<{
        id: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    update(id: number, dto: UpdateAppClientDto): Promise<{
        id: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    remove(id: number): Promise<{
        id: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    private collectAppClientDeleteBlockers;
    authenticate(appClientId: number, accountToken: string, appClient: RequestAppClient | undefined): Promise<{
        ok: boolean;
        appClient: RequestAppClient;
        accessToken: string;
        user: Omit<{
            id: number;
            createdAt: Date;
            email: string;
            password: string;
            username: string;
            mustChangePassword: boolean;
            employeeId: string;
            status: import("../../../generated/prisma/enums").UserStatus;
        }, "password">;
        accountTokenBound: boolean;
        userAppCreated: boolean;
    }>;
    testAuth(appClientId: number, accountToken: string): Promise<import("./auth/app-client-auth.types").AppClientAuthTestResult>;
    private ensureUserAppBinding;
    private resolveAutoBindRoleId;
    private bindUserIntegrations;
    private createRandomDsn;
    private generateUniqueDsn;
}
