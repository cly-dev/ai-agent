import type { RelationRef } from '../shared/relation-ref';
export declare class RoleSkillEntity {
    id?: number;
    roleId: number;
    skillId: number;
    role: RelationRef;
    skill: RelationRef;
}
