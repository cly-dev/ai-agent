import type { RelationRef } from '../shared/relation-ref';
export interface RoleType {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: RelationRef;
    createdAt?: Date;
    roleSkills: RelationRef[];
    userApps: RelationRef[];
    roleTools: RelationRef[];
}
