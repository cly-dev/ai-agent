import type { RelationRef } from '../shared/relation-ref';
export interface SkillType {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    prompt: string;
    config?: unknown | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    appClient?: RelationRef;
    skillTools: RelationRef[];
    agentSkills: RelationRef[];
    roleSkills: RelationRef[];
}
