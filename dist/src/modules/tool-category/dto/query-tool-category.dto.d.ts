import { PaginationQueryDto } from '../../../common/pagination';
declare const TOOL_CATEGORY_ORDER_BY_FIELDS: readonly ["id", "label", "sortOrder", "createdAt", "updatedAt"];
export type ToolCategoryOrderByField = (typeof TOOL_CATEGORY_ORDER_BY_FIELDS)[number];
export declare class QueryToolCategoryDto extends PaginationQueryDto {
    id?: number;
    label?: string;
    keyword?: string;
    orderBy?: ToolCategoryOrderByField;
    order?: 'asc' | 'desc';
}
export {};
