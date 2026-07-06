import { CreateUserModelConfigDto } from './dto/create-user-model-config.dto';
import { UpdateUserModelConfigDto } from './dto/update-user-model-config.dto';
import { UserModelConfigService } from './user-model-config.service';
export declare class UserModelConfigController {
    private readonly service;
    constructor(service: UserModelConfigService);
    create(body: CreateUserModelConfigDto): Promise<{
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
    findAll(userId?: string): Promise<{
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
    update(id: number, body: UpdateUserModelConfigDto): Promise<{
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
