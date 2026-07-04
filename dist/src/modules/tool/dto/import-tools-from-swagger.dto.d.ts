import { IntegrationAuthMode } from '../../../../generated/prisma/client';
export declare class ImportToolsFromSwaggerDto {
    specUrl: string;
    integrationId?: number;
    autoIntegration?: boolean;
    appClientId?: number;
    agentId?: number;
    integrationName?: string;
    integrationBaseUrl?: string;
    integrationApiKey?: string;
    integrationAuthMode?: IntegrationAuthMode;
    dryRun?: boolean;
    tags?: string[];
    ops?: string[];
    pathInclude?: string[];
    pathExclude?: string[];
    noDefaultPathExclude?: boolean;
    insecure?: boolean;
}
