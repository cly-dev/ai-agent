import type { WorkflowNodeDef } from './workflow.types';
import {
  resolveFetchDataToolIds,
  resolveGenerateAndPushHostToolIds,
} from './resolve-workflow-node-tool-refs.util';

export type WorkflowDerivedToolBinding = {
  toolId: number;
  isRequired: boolean;
};

export type WorkflowDerivedHostToolBinding = {
  hostToolId: number;
  isRequired: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** 从 Workflow 节点收集 input 上声明的 tool / hostTool id（配置 SSOT）。 */
export function collectWorkflowNodeBindingRefs(nodes: WorkflowNodeDef[]): {
  toolIds: number[];
  hostToolIds: number[];
} {
  const toolIds = new Set<number>();
  const hostToolIds = new Set<number>();
  for (const node of nodes) {
    const rawInput: unknown = node.input;
    if (!isRecord(rawInput)) {
      continue;
    }
    const input = rawInput;
    switch (node.action) {
      case 'fetch_data': {
        for (const toolId of resolveFetchDataToolIds(input)) {
          toolIds.add(toolId);
        }
        break;
      }
      case 'compose_mutation':
      case 'write_data': {
        const toolId = input.toolId;
        if (isPositiveInt(toolId)) {
          toolIds.add(toolId);
        }
        break;
      }
      case 'generate_and_push': {
        for (const hostToolId of resolveGenerateAndPushHostToolIds(input)) {
          hostToolIds.add(hostToolId);
        }
        break;
      }
      default:
        break;
    }
  }
  return {
    toolIds: [...toolIds],
    hostToolIds: [...hostToolIds],
  };
}

/** 由 nodes 推导 WorkflowTool / WorkflowHostTool 行（持久化投影，非第二配置入口）。 */
export function deriveWorkflowBindingsFromNodes(nodes: WorkflowNodeDef[]): {
  tools: WorkflowDerivedToolBinding[];
  hostTools: WorkflowDerivedHostToolBinding[];
} {
  const refs = collectWorkflowNodeBindingRefs(nodes);
  return {
    tools: refs.toolIds.map((toolId) => ({ toolId, isRequired: false })),
    hostTools: refs.hostToolIds.map((hostToolId) => ({
      hostToolId,
      isRequired: false,
    })),
  };
}

export type WorkflowExplicitToolBinding = {
  toolId: number;
  isRequired?: boolean;
};

export type WorkflowExplicitHostToolBinding = {
  hostToolId: number;
  isRequired?: boolean;
};

export type WorkflowBindingResolutionIssue = {
  path: string;
  code: string;
  message: string;
};

/**
 * 保存 Workflow 时的绑定解析：
 * - nodes.input 上的 ID 为权威来源
 * - 可选 `tools` / `hostTools` 仅用于覆盖同 ID 的 `isRequired`，不得引用未出现在 nodes 中的 ID
 */
export function resolveWorkflowBindingsForSave(input: {
  nodes: WorkflowNodeDef[];
  explicitTools?: WorkflowExplicitToolBinding[];
  explicitHostTools?: WorkflowExplicitHostToolBinding[];
}): {
  tools: WorkflowDerivedToolBinding[];
  hostTools: WorkflowDerivedHostToolBinding[];
  issues: WorkflowBindingResolutionIssue[];
} {
  const derived = deriveWorkflowBindingsFromNodes(input.nodes);
  const issues: WorkflowBindingResolutionIssue[] = [];
  const nodeToolIds = new Set(derived.tools.map((row) => row.toolId));
  const nodeHostToolIds = new Set(derived.hostTools.map((row) => row.hostToolId));

  const requiredByToolId = new Map<number, boolean>();
  for (const row of input.explicitTools ?? []) {
    if (!nodeToolIds.has(row.toolId)) {
      issues.push({
        path: 'tools',
        code: 'orphan_tool_binding',
        message: `tools[].toolId=${row.toolId} is not referenced by any workflow node input.toolIds/toolId`,
      });
      continue;
    }
    requiredByToolId.set(row.toolId, row.isRequired ?? false);
  }

  const requiredByHostToolId = new Map<number, boolean>();
  for (const row of input.explicitHostTools ?? []) {
    if (!nodeHostToolIds.has(row.hostToolId)) {
      issues.push({
        path: 'hostTools',
        code: 'orphan_host_tool_binding',
        message: `hostTools[].hostToolId=${row.hostToolId} is not referenced by any workflow node input.hostToolIds/hostToolId`,
      });
      continue;
    }
    requiredByHostToolId.set(row.hostToolId, row.isRequired ?? false);
  }

  return {
    tools: derived.tools.map((row) => ({
      toolId: row.toolId,
      isRequired: requiredByToolId.get(row.toolId) ?? false,
    })),
    hostTools: derived.hostTools.map((row) => ({
      hostToolId: row.hostToolId,
      isRequired: requiredByHostToolId.get(row.hostToolId) ?? false,
    })),
    issues,
  };
}
