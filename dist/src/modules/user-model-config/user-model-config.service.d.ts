import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserModelConfigDto } from './dto/create-user-model-config.dto';
import { UpdateUserModelConfigDto } from './dto/update-user-model-config.dto';
export declare class UserModelConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateUserModelConfigDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string;
        maxTokens: number;
        temperature: number;
        enabled: boolean;
        userId: number;
    }>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string;
        maxTokens: number;
        temperature: number;
        enabled: boolean;
        userId: number;
    }[]>;
    findByUser(userId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string;
        maxTokens: number;
        temperature: number;
        enabled: boolean;
        userId: number;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string;
        maxTokens: number;
        temperature: number;
        enabled: boolean;
        userId: number;
    }>;
    update(id: number, data: UpdateUserModelConfigDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string;
        maxTokens: number;
        temperature: number;
        enabled: boolean;
        userId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string;
        maxTokens: number;
        temperature: number;
        enabled: boolean;
        userId: number;
    }>;
}
