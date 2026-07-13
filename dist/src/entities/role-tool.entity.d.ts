import type { RelationRef } from '../shared/relation-ref';
export declare class RoleToolEntity {
    id?: number;
    roleId: number;
    toolId: number;
    createdAt?: Date;
    role: RelationRef;
    tool: RelationRef;
}
