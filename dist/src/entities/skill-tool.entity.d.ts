import type { RelationRef } from '../shared/relation-ref';
export declare class SkillToolEntity {
    id?: number;
    skillId: number;
    toolId: number;
    isRequired?: boolean;
    skill: RelationRef;
    tool: RelationRef;
}
