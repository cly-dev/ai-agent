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
    create(body: CreateAppClientDto): Promise<{
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
    testAuth(id: number, body: TestAppClientAuthDto): Promise<import("./auth/app-client-auth.types").AppClientAuthTestResult>;
    update(id: number, body: UpdateAppClientDto): Promise<{
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
}
