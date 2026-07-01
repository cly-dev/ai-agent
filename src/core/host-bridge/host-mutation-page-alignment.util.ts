import { parseAgentMetadata } from '../tool-engine/tool-agent-metadata.util';
import { isMutationTool } from '../tool-engine/tool-mutation.util';
import type { HostMutationRunStep, HostMutationScopedTool } from './host-mutation-step.types';
import type { AgentChatPageContext } from './page-context.types';

function normalizeIdentifierToken(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
}

function collectLeafIdentifierValues(
  value: unknown,
  leaf: string,
  out: Set<string>,
  depth = 0,
): void {
  if (depth > 8 || value == null) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectLeafIdentifierValues(item, leaf, out, depth + 1);
    }
    return;
  }
  if (typeof value !== 'object') {
    return;
  }
  const record = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, leaf)) {
    const token = normalizeIdentifierToken(record[leaf]);
    if (token) {
      out.add(token);
    }
  }
  for (const nested of Object.values(record)) {
    collectLeafIdentifierValues(nested, leaf, out, depth + 1);
  }
}

/** 从成功 mutation 步的入参中收集 businessFields 对应叶子值（含嵌套数组）。 */
export function collectSuccessfulMutationIdentifierValues(input: {
  steps: HostMutationRunStep[];
  scopedTools: HostMutationScopedTool[];
}): Set<string> {
  const toolByName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
  const values = new Set<string>();
  for (const step of input.steps) {
    if (step.type !== 'tool' || !step.name) {
      continue;
    }
    if (step.meta?.executionStatus !== 'SUCCESS') {
      continue;
    }
    const def = toolByName.get(step.name);
    if (!def || !isMutationTool(def.agentMetadata)) {
      continue;
    }
    const businessFields =
      parseAgentMetadata(def.agentMetadata)?.businessFields ?? [];
    const args = {
      ...((step.meta?.llmArguments as Record<string, unknown> | undefined) ??
        {}),
      ...((step.input as Record<string, unknown> | undefined) ?? {}),
    };
    for (const field of businessFields) {
      const leaf = field.includes('.')
        ? (field.split('.').pop() ?? field)
        : field;
      if (!leaf.trim()) {
        continue;
      }
      collectLeafIdentifierValues(args, leaf.trim(), values);
    }
  }
  return values;
}

/**
 * mutation 成功后是否应触发 ON_MUTATION_SUCCESS host_tool：
 * pageContext.entity.id 须与本次成功写操作的 business identifier 之一一致。
 * 避免「用户在 campaign 页发起 review 写操作」却刷新 campaign-42。
 */
export function isPageContextAlignedWithSuccessfulMutations(input: {
  pageContext: AgentChatPageContext;
  steps: HostMutationRunStep[];
  scopedTools: HostMutationScopedTool[];
}): boolean {
  const entityId = normalizeIdentifierToken(input.pageContext.entity?.id);
  if (!entityId) {
    return false;
  }
  const mutationIds = collectSuccessfulMutationIdentifierValues({
    steps: input.steps,
    scopedTools: input.scopedTools,
  });
  if (mutationIds.size === 0) {
    return false;
  }
  return mutationIds.has(entityId);
}
