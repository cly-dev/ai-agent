export declare class CreateUserModelConfigDto {
    userId: number;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    enabled?: boolean;
}
