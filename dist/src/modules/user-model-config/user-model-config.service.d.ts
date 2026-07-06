import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserModelConfigDto } from './dto/create-user-model-config.dto';
import { UpdateUserModelConfigDto } from './dto/update-user-model-config.dto';
export declare class UserModelConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateUserModelConfigDto): Promise<{
        id: number;
        createdAt: Date;
        model: string;
        userId: number;
        updatedAt: Date;
        provider: string;
        apiKey: string;
        baseUrl: string;
        temperature: number;
        maxTokens: number;
        enabled: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        model: string;
        userId: number;
        updatedAt: Date;
        provider: string;
        apiKey: string;
        baseUrl: string;
        temperature: number;
        maxTokens: number;
        enabled: boolean;
    }[]>;
    findByUser(userId: number): Promise<{
        id: number;
        createdAt: Date;
        model: string;
        userId: number;
        updatedAt: Date;
        provider: string;
        apiKey: string;
        baseUrl: string;
        temperature: number;
        maxTokens: number;
        enabled: boolean;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        model: string;
        userId: number;
        updatedAt: Date;
        provider: string;
        apiKey: string;
        baseUrl: string;
        temperature: number;
        maxTokens: number;
        enabled: boolean;
    }>;
    update(id: number, data: UpdateUserModelConfigDto): Promise<{
        id: number;
        createdAt: Date;
        model: string;
        userId: number;
        updatedAt: Date;
        provider: string;
        apiKey: string;
        baseUrl: string;
        temperature: number;
        maxTokens: number;
        enabled: boolean;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        model: string;
        userId: number;
        updatedAt: Date;
        provider: string;
        apiKey: string;
        baseUrl: string;
        temperature: number;
        maxTokens: number;
        enabled: boolean;
    }>;
}
