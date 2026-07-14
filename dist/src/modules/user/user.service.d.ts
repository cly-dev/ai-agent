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
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: UserStatus;
    }>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: UserStatus;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: UserStatus;
    }>;
    update(id: number, data: UpdateUserDto): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: UserStatus;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: UserStatus;
    }>;
    private syntheticEmployeeIdFromEmail;
    findOrCreateByExternalAccount(profile: ExternalAccountProfile): Promise<Omit<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: UserStatus;
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
            createdAt: Date;
            email: string;
            password: string;
            username: string;
            mustChangePassword: boolean;
            employeeId: string;
            status: UserStatus;
        };
        mustChangePassword: boolean;
    }>;
    getPasswordReminder(userId: number): Promise<{
        mustChangePassword: boolean;
        message: string;
    }>;
    getAllowedToolsForApp(userId: number, appClientId: number): Promise<{
        path: string;
        id: number;
        appClientId: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        method: import("../../../generated/prisma/enums").HttpMethod;
        definitionKey: string;
        riskLevel: import("../../../generated/prisma/enums").ToolLevel;
        schema: import("@prisma/client/runtime/client").JsonValue;
        inputSchema: import("@prisma/client/runtime/client").JsonValue;
        outputSchema: import("@prisma/client/runtime/client").JsonValue;
        responseProfile: import("@prisma/client/runtime/client").JsonValue;
        agentMetadata: import("@prisma/client/runtime/client").JsonValue;
        integrationId: number;
        toolCategoryId: number;
        timeout: number;
    }[]>;
}
