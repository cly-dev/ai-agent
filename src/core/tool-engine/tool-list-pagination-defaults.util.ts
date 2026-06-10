import { parseAgentMetadata } from './tool-agent-metadata.util';
import { OperationType } from './tool-agent-metadata.types';
import { parseResponseProfile } from './tool-output-projection.util';
import {
  classifyPaginationParam,
  resolveDefaultListPage,
  resolveDefaultListSize,
} from './tool-pagination-params.util';

type PaginationParamSpec = {
  name: string;
  in: string;
  type?: string;
  default?: unknown;
};

function isMissingParamValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
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
  const fallback = role === 'page' ? resolveDefaultListPage() : resolveDefaultListSize();
  if (spec.default !== undefined && spec.default !== null) {
    return coercePositiveInt(spec.default, fallback);
  }
  return fallback;
}

function specsHavePaginationParams(specs: PaginationParamSpec[]): boolean {
  let hasPage = false;
  let hasSize = false;
  for (const spec of specs) {
    if (spec.in !== 'query') {
      continue;
    }
    if (spec.type !== 'integer' && spec.type !== 'number') {
      continue;
    }
    const role = classifyPaginationParam(spec.name);
    if (role === 'page') {
      hasPage = true;
    }
    if (role === 'size') {
      hasSize = true;
    }
  }
  return hasPage && hasSize;
}

/** Whether to auto-fill missing page/size for this tool invocation. */
export function shouldApplyListPaginationDefaults(input: {
  agentMetadata: unknown;
  responseProfile?: unknown;
  specs: PaginationParamSpec[];
}): boolean {
  const meta = parseAgentMetadata(input.agentMetadata);
  if (meta) {
    if (
      meta.operation === OperationType.LIST ||
      meta.operation === OperationType.SEARCH ||
      meta.operation === OperationType.STATS
    ) {
      return true;
    }
  }

  const profile = parseResponseProfile(input.responseProfile);
  if (profile?.decisionRole === 'read-list') {
    return true;
  }
  if (profile?.listPath) {
    return true;
  }

  return specsHavePaginationParams(input.specs);
}

/**
 * 列表类工具在 LLM 未传分页参数时，按 OpenAPI query 参数名补全 page / size。
 * 仅对 spec 中已声明的 query 整型参数生效，不凭空造字段。
 */
export function applyListPaginationDefaults(
  input: Record<string, unknown>,
  specs: PaginationParamSpec[],
  options?: { agentMetadata?: unknown; responseProfile?: unknown },
): Record<string, unknown> {
  if (
    !shouldApplyListPaginationDefaults({
      agentMetadata: options?.agentMetadata,
      responseProfile: options?.responseProfile,
      specs,
    })
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
