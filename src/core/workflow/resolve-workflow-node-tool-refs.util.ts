/**
 * 从节点 input 解析工具白名单。
 * 支持 toolIds[] / hostToolIds[]；兼容旧单字段 toolId / hostToolId（归一成单元素数组）。
 */

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function readPositiveIntList(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const row of value) {
    if (!isPositiveInt(row) || seen.has(row)) {
      continue;
    }
    seen.add(row);
    ids.push(row);
  }
  return ids;
}

/** fetch_data：优先 toolIds[]，否则 toolId → [id]。 */
export function resolveFetchDataToolIds(input: unknown): number[] {
  if (!isRecord(input)) {
    return [];
  }
  const fromList = readPositiveIntList(input.toolIds);
  if (fromList.length > 0) {
    return fromList;
  }
  return isPositiveInt(input.toolId) ? [input.toolId] : [];
}

/** generate_and_push：优先 hostToolIds[]，否则 hostToolId → [id]。 */
export function resolveGenerateAndPushHostToolIds(input: unknown): number[] {
  if (!isRecord(input)) {
    return [];
  }
  const fromList = readPositiveIntList(input.hostToolIds);
  if (fromList.length > 0) {
    return fromList;
  }
  return isPositiveInt(input.hostToolId) ? [input.hostToolId] : [];
}
