import type { RelationRef } from '../shared/relation-ref';
export declare class ToolEntity {
    id?: number;
    appClientId: number;
    definitionKey: string;
    name: string;
    description: string;
    riskLevel?: RelationRef;
    schema: unknown;
    skillTools: RelationRef[];
    inputSchema: unknown;
    outputSchema?: unknown | null;
    method: RelationRef;
    path: string;
    integrationId: number;
    integration: RelationRef;
    appClient: RelationRef;
    toolCategoryId?: number | null;
    toolCategory?: RelationRef | null;
    roleTools: RelationRef[];
    isActive?: boolean;
    timeout?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}
