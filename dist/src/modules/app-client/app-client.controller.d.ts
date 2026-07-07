import { Request } from 'express';
import { AppClientService } from './app-client.service';
import { CreateAppClientDto } from './dto/create-app-client.dto';
import { UpdateAppClientDto } from './dto/update-app-client.dto';
import { TestAppClientAuthDto } from './dto/test-app-client-auth.dto';
export declare class AppClientController {
    private readonly service;
    constructor(service: AppClientService);
    private appClientId;
    authenticate(req: Request): Promise<{
        ok: boolean;
        appClient: import("../../auth/request-app-client").RequestAppClient;
        accessToken: string;
        user: Omit<{
            id: number;
            employeeId: string;
            email: string;
            password: string;
            username: string;
            status: import("../../../generated/prisma/enums").UserStatus;
            mustChangePassword: boolean;
            createdAt: Date;
        }, "password">;
        accountTokenBound: boolean;
        userAppCreated: boolean;
    }>;
    create(body: CreateAppClientDto): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    findAll(): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    findOne(id: number): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    testAuth(id: number, body: TestAppClientAuthDto): Promise<import("./auth/app-client-auth.types").AppClientAuthTestResult>;
    update(id: number, body: UpdateAppClientDto): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    remove(id: number): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        dsn: string;
        authConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
