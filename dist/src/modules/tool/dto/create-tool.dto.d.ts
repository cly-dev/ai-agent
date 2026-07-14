import { HttpMethod, ToolLevel } from '../../../../generated/prisma/client';
export declare class CreateToolDto {
    appClientId: number;
    name: string;
    definitionKey?: string;
    description: string;
    riskLevel?: ToolLevel;
    schema: Record<string, unknown>;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    responseProfile?: Record<string, unknown>;
    agentMetadata?: Record<string, unknown>;
    method: HttpMethod;
    path: string;
    integrationId: number;
    toolCategoryId?: number;
    isActive?: boolean;
    timeout?: number;
}
