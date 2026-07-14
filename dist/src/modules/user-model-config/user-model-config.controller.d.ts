import { CreateUserModelConfigDto } from './dto/create-user-model-config.dto';
import { UpdateUserModelConfigDto } from './dto/update-user-model-config.dto';
import { UserModelConfigService } from './user-model-config.service';
export declare class UserModelConfigController {
    private readonly service;
    constructor(service: UserModelConfigService);
    create(body: CreateUserModelConfigDto): Promise<{
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
    findAll(userId?: string): Promise<{
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
    update(id: number, body: UpdateUserModelConfigDto): Promise<{
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
