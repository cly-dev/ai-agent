import type { RelationRef } from '../shared/relation-ref';
export declare class AppClientEntity {
    id?: number;
    name: string;
    dsn: string;
    description?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    agents: RelationRef[];
    tools: RelationRef[];
    sessions: RelationRef[];
    agentRuns: RelationRef[];
    integrations: RelationRef[];
    userApps: RelationRef[];
}
