import { IntegrationAuthMode } from '../../../../generated/prisma/client';
export declare class CreateIntegrationDto {
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey?: string;
    description?: string;
    authMode?: IntegrationAuthMode;
}
