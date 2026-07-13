import type { RelationRef } from '../shared/relation-ref';
export declare class IntegrationEntity {
    id?: number;
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode: 'USER_ONLY' | 'SYSTEM_ONLY' | 'USER_PREFERRED';
    appClient: RelationRef;
    tools: RelationRef[];
    createdAt?: Date;
    updatedAt?: Date;
}
