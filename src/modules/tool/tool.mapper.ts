import type { ToolDetailRow, ToolResponse } from './tool.types';

/** 将 Prisma 行映射为 API 响应，补充 tags 等展示字段。 */
export function toToolResponse(row: ToolDetailRow): ToolResponse {
  const tags: string[] = [];
  const categoryLabel = row.toolCategory?.label?.trim();
  if (categoryLabel) {
    tags.push(categoryLabel);
  }
  return {
    ...row,
    tags,
  };
}

export function toToolResponseList(rows: ToolDetailRow[]): ToolResponse[] {
  return rows.map((row) => toToolResponse(row));
}
