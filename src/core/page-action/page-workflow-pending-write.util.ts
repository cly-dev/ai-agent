import type { ComposeMutationNodeInput } from '../workflow/workflow-node-input.types';
import type { WriteDataNodeInput } from '../workflow/workflow-node-input.types';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
import { resolveWorkflowNodeRuntimeInput } from '../workflow/resolve-workflow-node-runtime-input.util';

/** page workflow compose 节点产出：供 present / await / resume 读取。 */
export type PageWorkflowComposeOutput = {
  tool: string;
  toolId: number;
  arguments: Record<string, unknown>;
  riskLevel: string;
};

const COMPOSE_OUTPUT_KEY = 'page_compose_mutation';

export function buildPageComposeNodeOutput(
  output: PageWorkflowComposeOutput,
): Record<string, unknown> {
  return { [COMPOSE_OUTPUT_KEY]: output };
}

export function resolvePageWorkflowPresentSummary(input: {
  nodes: WorkflowNodeDef[];
  nodeOutputs: Record<string, unknown>;
  fillText: string;
}): string | null {
  for (const node of input.nodes) {
    if (node.action !== 'present_mutation') {
      continue;
    }
    const byRef = input.nodeOutputs[`obs:present_mutation:${node.id}`];
    const byId = input.nodeOutputs[node.id];
    for (const raw of [byRef, byId]) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        continue;
      }
      const text = (raw as { summaryText?: unknown }).summaryText;
      if (typeof text === 'string' && text.trim()) {
        return text.trim();
      }
    }
  }
  const fill = input.fillText.trim();
  return fill.length > 0 ? fill : null;
}

export function resolvePageWorkflowPendingWrite(input: {
  nodes: WorkflowNodeDef[];
  nodeOutputs: Record<string, unknown>;
}): PageWorkflowComposeOutput | null {
  for (const node of input.nodes) {
    if (node.action !== 'compose_mutation') {
      continue;
    }
    const raw = input.nodeOutputs[node.id];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    const composed = (raw as Record<string, unknown>)[COMPOSE_OUTPUT_KEY];
    if (!composed || typeof composed !== 'object' || Array.isArray(composed)) {
      continue;
    }
    const row = composed as PageWorkflowComposeOutput;
    const tool = row.tool?.trim();
    if (!tool) {
      continue;
    }
    const args = row.arguments;
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      continue;
    }
    return {
      tool,
      toolId: row.toolId,
      arguments: args,
      riskLevel: row.riskLevel ?? 'L2',
    };
  }

  const writeNode = input.nodes.find((row) => row.action === 'write_data');
  const writeInput = writeNode
    ? (resolveWorkflowNodeRuntimeInput(writeNode) as WriteDataNodeInput)
    : undefined;
  const toolId = writeInput?.toolId;
  if (writeNode && typeof toolId === 'number' && toolId > 0) {
    for (const output of Object.values(input.nodeOutputs)) {
      if (!output || typeof output !== 'object' || Array.isArray(output)) {
        continue;
      }
      const candidate = output as Record<string, unknown>;
      const toolName =
        typeof candidate.toolName === 'string' ? candidate.toolName.trim() : '';
      const args = candidate.arguments ?? candidate.args;
      if (toolName && args && typeof args === 'object' && !Array.isArray(args)) {
        return {
          tool: toolName,
          toolId,
          arguments: args as Record<string, unknown>,
          riskLevel: 'L2',
        };
      }
    }
  }

  return null;
}

export function readComposeMutationToolId(
  input: ComposeMutationNodeInput | undefined,
): number | null {
  const toolId = input?.toolId;
  return typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0
    ? toolId
    : null;
}

export function readWriteDataToolId(
  input: WriteDataNodeInput | undefined,
): number | null {
  const toolId = input?.toolId;
  return typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0
    ? toolId
    : null;
}
