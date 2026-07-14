import type { RelationRef } from '../shared/relation-ref';
export declare class SessionEntity {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date;
    user: RelationRef;
    appClient: RelationRef;
    messages: RelationRef[];
    agentRuns: RelationRef[];
}
