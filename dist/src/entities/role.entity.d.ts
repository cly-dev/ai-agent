import type { RelationRef } from '../shared/relation-ref';
export declare class RoleEntity {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: RelationRef;
    createdAt?: Date;
    roleSkills: RelationRef[];
    userApps: RelationRef[];
    roleTools: RelationRef[];
}
