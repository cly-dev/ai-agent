import { PrismaService } from '../../prisma/prisma.service';
import { AddUserToAppDto } from './dto/add-user-to-app.dto';
import { CreateUserAppDto } from './dto/create-user-app.dto';
import { UpdateUserAppDto } from './dto/update-user-app.dto';
export declare class UserAppService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(body: CreateUserAppDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        roleId: number;
        appId: number;
    }>;
    findAll(): Promise<({
        user: {
            id: number;
            email: string;
            username: string;
        };
        role: {
            name: string;
            id: number;
            allowToolLevel: import("../../../generated/prisma/enums").ToolLevel;
        };
        appClient: {
            name: string;
            id: number;
            dsn: string;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number;
        roleId: number;
        appId: number;
    })[]>;
    findOne(id: number): Promise<{
        user: {
            id: number;
            email: string;
            username: string;
        };
        role: {
            name: string;
            id: number;
            allowToolLevel: import("../../../generated/prisma/enums").ToolLevel;
        };
        appClient: {
            name: string;
            id: number;
            dsn: string;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number;
        roleId: number;
        appId: number;
    }>;
    update(id: number, body: UpdateUserAppDto): Promise<{
        user: {
            id: number;
            email: string;
            username: string;
        };
        role: {
            name: string;
            id: number;
            allowToolLevel: import("../../../generated/prisma/enums").ToolLevel;
        };
        appClient: {
            name: string;
            id: number;
            dsn: string;
        };
    } & {
        id: number;
        createdAt: Date;
        userId: number;
        roleId: number;
        appId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        roleId: number;
        appId: number;
    }>;
    addUser(appId: number, body: AddUserToAppDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        roleId: number;
        appId: number;
    }>;
    private ensureBaseEntities;
    private ensureUniqueUserApp;
    private rethrowPrismaError;
}
