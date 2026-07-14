import type { RelationRef } from '../shared/relation-ref';
export interface ToolCategoryType {
    id?: number;
    label: string;
    description?: string | null;
    sortOrder?: number;
    tools: RelationRef[];
    createdAt?: Date;
    updatedAt?: Date;
}
