import type { RelationRef } from '../shared/relation-ref';
export interface RoleToolType {
    id?: number;
    roleId: number;
    toolId: number;
    createdAt?: Date;
    role: RelationRef;
    tool: RelationRef;
}
