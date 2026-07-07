import type { RelationRef } from '../shared/relation-ref';
export declare class ToolCategoryEntity {
    id?: number;
    label: string;
    description?: string | null;
    sortOrder?: number;
    tools: RelationRef[];
    createdAt?: Date;
    updatedAt?: Date;
}
