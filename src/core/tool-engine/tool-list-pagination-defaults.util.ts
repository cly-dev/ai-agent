import { parseAgentMetadata } from './tool-agent-metadata.util';
import { OperationType } from './tool-agent-metadata.types';

const DEFAULT_LIST_PAGE = 1;
const DEFAULT_LIST_SIZE = 100;

type PaginationParamSpec = {
  name: string;
  in: string;
  type?: string;
  default?: unknown;
};

/** query 参数名 → page（不区分大小写，全名匹配）。 */
const PAGE_PARAM_RE = /^page(?:number|num|no|index)?$/i;

/** query 参数名 → page size / limit（不区分大小写，全名匹配）。 */
const SIZE_PARAM_RE =
  /^(?:page)?size$|^limit$|^pagesize$|^per_?page$|^page_size$|^maxresults$/i;

function isMissingParamValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function classifyPaginationParam(name: string): 'page' | 'size' | null {
  if (PAGE_PARAM_RE.test(name)) {
    return 'page';
  }
  if (SIZE_PARAM_RE.test(name)) {
    return 'size';
  }
  return null;
}

function coercePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.trunc(value));
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, parsed);
    }
  }
  return fallback;
}

function resolveDefaultForPaginationRole(
  role: 'page' | 'size',
  spec: PaginationParamSpec,
): number {
  if (spec.default !== undefined && spec.default !== null) {
    return coercePositiveInt(
      spec.default,
      role === 'page' ? DEFAULT_LIST_PAGE : DEFAULT_LIST_SIZE,
    );
  }
  return role === 'page' ? DEFAULT_LIST_PAGE : DEFAULT_LIST_SIZE;
}

/**
 * LIST / SEARCH 工具在 LLM 未传分页参数时，按 OpenAPI query 参数名补全 page / size。
 * 仅对 spec 中已声明的 query 整型参数生效，不凭空造字段。
 */
export function applyListPaginationDefaults(
  input: Record<string, unknown>,
  specs: PaginationParamSpec[],
  agentMetadata: unknown,
): Record<string, unknown> {
  const meta = parseAgentMetadata(agentMetadata);
  if (!meta) {
    return input;
  }
  if (
    meta.operation !== OperationType.LIST &&
    meta.operation !== OperationType.SEARCH
  ) {
    return input;
  }

  const out = { ...input };
  for (const spec of specs) {
    if (spec.in !== 'query') {
      continue;
    }
    if (spec.type !== 'integer' && spec.type !== 'number') {
      continue;
    }
    const role = classifyPaginationParam(spec.name);
    if (!role) {
      continue;
    }
    if (!isMissingParamValue(out[spec.name])) {
      continue;
    }
    out[spec.name] = resolveDefaultForPaginationRole(role, spec);
  }
  return out;
}
