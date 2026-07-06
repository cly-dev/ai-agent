import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export type ExternalAccountProfile = {
    employeeId?: string;
    email: string;
    username: string;
    cnName?: string;
    nickName?: string;
    active: boolean;
};
export declare class UserService {
    private readonly prisma;
    private readonly jwtService;
    private readonly toolLevelWeight;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private hashPassword;
    private generateInitialPassword;
    private verifyPassword;
    create(data: CreateUserDto): Promise<{
        generatedPassword: string;
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    update(id: number, data: UpdateUserDto): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    private syntheticEmployeeIdFromEmail;
    findOrCreateByExternalAccount(profile: ExternalAccountProfile): Promise<Omit<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }, "password">>;
    signUserAccessToken(user: {
        id: number;
        email: string;
        username: string;
    }): Promise<string>;
    assertUserIsActive(status: UserStatus): void;
    private toSafeUser;
    login(data: LoginUserDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            employeeId: string;
            email: string;
            password: string;
            username: string;
            status: UserStatus;
            mustChangePassword: boolean;
            createdAt: Date;
        };
        mustChangePassword: boolean;
    }>;
    getPasswordReminder(userId: number): Promise<{
        mustChangePassword: boolean;
        message: string;
    }>;
    getAllowedToolsForApp(userId: number, appClientId: number): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        appClientId: number;
        updatedAt: Date;
        integrationId: number;
        isActive: boolean;
        description: string;
        path: string;
        definitionKey: string;
        riskLevel: import("../../../generated/prisma/enums").ToolLevel;
        schema: import("@prisma/client/runtime/client").JsonValue;
        inputSchema: import("@prisma/client/runtime/client").JsonValue;
        outputSchema: import("@prisma/client/runtime/client").JsonValue;
        responseProfile: import("@prisma/client/runtime/client").JsonValue;
        agentMetadata: import("@prisma/client/runtime/client").JsonValue;
        method: import("../../../generated/prisma/enums").HttpMethod;
        toolCategoryId: number;
        timeout: number;
    }[]>;
}
