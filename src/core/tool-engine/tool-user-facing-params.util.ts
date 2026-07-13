import type { CompactToolInput, ToolParamCompact } from './tool-decision-input.util';
import { isPaginationParam } from './tool-pagination-params.util';

/** query/body 排序字段（引擎默认，非用户业务 filter）。 */
const SORT_PARAM_RE = /^sort(?:_by|order|field)?$/i;

/** 无法从 schema.in 推断时的 body/query 集成参数默认名（可用 TOOL_INFRA_PARAM_NAMES 覆盖扩展）。 */
const DEFAULT_EXTRA_INFRA_PARAM_NAMES = ['vo'] as const;

function readExtraInfraParamNames(): Set<string> {
  const raw = process.env.TOOL_INFRA_PARAM_NAMES?.trim();
  if (!raw) {
    return new Set(DEFAULT_EXTRA_INFRA_PARAM_NAMES);
  }
  return new Set(
    raw
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0),
  );
}

export function isSortParam(name: string): boolean {
  return SORT_PARAM_RE.test(name);
}

/** OpenAPI 参数是否由引擎/集成层填充，不参与用户侧必填收窄。 */
export function isInfraToolParam(
  row: Pick<ToolParamCompact, 'name' | 'in'>,
): boolean {
  if (row.in === 'header') {
    return true;
  }
  if (isPaginationParam(row.name)) {
    return true;
  }
  if (isSortParam(row.name)) {
    return true;
  }
  if (readExtraInfraParamNames().has(row.name)) {
    return true;
  }
  return false;
}

/** observation / 扁平 args 键名是否应省略（无 in 信息时的启发式）。 */
export function isInfraParamName(name: string): boolean {
  if (isPaginationParam(name)) {
    return true;
  }
  if (isSortParam(name)) {
    return true;
  }
  if (readExtraInfraParamNames().has(name)) {
    return true;
  }
  if (/^X-[A-Z0-9-]+$/i.test(name)) {
    return true;
  }
  return false;
}

/** schema 上用户必须提供（或从消息/pageContext 解析）的必填参数名。 */
export function listUserFacingRequiredParamNames(
  input: CompactToolInput,
): string[] {
  const fromParameters = input.parameters
    .filter((row) => row.required && !isInfraToolParam(row))
    .map((row) => row.name);
  const fromBody =
    input.requestBody?.properties
      ?.filter((row) => row.required && !isInfraToolParam(row))
      .map((row) => row.name) ?? [];
  return [...new Set([...fromParameters, ...fromBody])];
}

/** decision <tool_schema> 展示的 optional filter 名。 */
export function listOptionalFilterParamNames(input: CompactToolInput): string[] {
  const fromParams = input.parameters
    .filter((row) => !row.required && !isInfraToolParam(row))
    .map((row) => row.name);
  const optional = input.optionalParamNames ?? [];
  return [...new Set([...fromParams, ...optional])];
}
