import type {
  ToolCategoryDetailRow,
  ToolCategoryResponse,
} from './tool-category.types';

export function toToolCategoryResponse(
  row: ToolCategoryDetailRow,
): ToolCategoryResponse {
  return {
    ...row,
    toolCount: row._count?.tools ?? 0,
  };
}

export function toToolCategoryResponseList(
  rows: ToolCategoryDetailRow[],
): ToolCategoryResponse[] {
  return rows.map((row) => toToolCategoryResponse(row));
}
