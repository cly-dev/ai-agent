import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { toolRequiresWriteConfirmation } from '../risk/risk-level.util';
import { resolveLatestPlanComposeWrite } from '../agent-engine/engine/main/plan-present/plan-compose-write.util';
import { getWorkflowNodeDef } from './workflow-graph-routing.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';

export type WriteConfirmationPolicy =
  | { kind: 'gate_now' }
  | { kind: 'defer_to_workflow_await' }
  | { kind: 'bypass_after_workflow_await' };

function workflowAwaitNodeId(
  defs: WorkflowNodeDef[],
): string | null {
  return defs.find((row) => row.action === 'await_user_confirm')?.id ?? null;
}

export function workflowHasAwaitUserConfirmNode(
  defs: WorkflowNodeDef[] | null | undefined,
): boolean {
  return workflowAwaitNodeId(defs ?? []) != null;
}

function isWorkflowNodeCompleted(
  run: WorkflowRunState,
  nodeId: string,
): boolean {
  const node = run.nodes.find((row) => row.nodeId === nodeId);
  return node?.status === 'succeeded' || node?.status === 'skipped';
}

/** 写确认策略：Plan 路径 gate_now；显式 mutation Workflow 在 await 前 defer、await 后 bypass。 */
export function resolveWriteConfirmationPolicy(input: {
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
  taskPlan?: TaskPlanSnapshot | null;
  approvedWriteToolNames?: Iterable<string>;
}): WriteConfirmationPolicy {
  const defs = input.workflowNodeDefs;
  const run = input.workflowRun;
  if (!defs?.length || !run?.currentNodeId) {
    return { kind: 'gate_now' };
  }

  const awaitNodeId = workflowAwaitNodeId(defs);
  if (!awaitNodeId) {
    return { kind: 'gate_now' };
  }

  const currentDef = getWorkflowNodeDef(defs, run.currentNodeId);
  const awaitCompleted = isWorkflowNodeCompleted(run, awaitNodeId);

  if (awaitCompleted && currentDef?.action === 'write_data') {
    return { kind: 'bypass_after_workflow_await' };
  }

  if (!awaitCompleted && currentDef?.action !== 'await_user_confirm') {
    return { kind: 'defer_to_workflow_await' };
  }

  return { kind: 'gate_now' };
}

function readPositiveToolId(input: unknown): number | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  const toolId = (input as { toolId?: unknown }).toolId;
  return typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0
    ? toolId
    : null;
}

/** await_user_confirm 续跑后：已确认预览，write_data 可跳过 tools.node 二次 gate。 */
export function resolveApprovedWriteToolNamesAfterWorkflowAwait(input: {
  observations: ToolObservation[];
  scopedTools: AgentEngineTool[];
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): string[] {
  const composed = resolveLatestPlanComposeWrite(input.observations);
  if (composed?.tool?.trim()) {
    return [composed.tool.trim()];
  }

  const writeNode = input.workflowNodeDefs?.find(
    (row) => row.action === 'write_data',
  );
  const toolId = readPositiveToolId(writeNode?.input);
  if (toolId != null) {
    const bound = input.scopedTools.find((tool) => tool.id === toolId);
    if (bound?.name) {
      return [bound.name];
    }
  }

  return input.scopedTools
    .filter((tool) =>
      toolRequiresWriteConfirmation({
        riskLevel: tool.riskLevel,
        agentMetadata: tool.agentMetadata,
      }),
    )
    .map((tool) => tool.name);
}

export function isWorkflowAwaitUserConfirmResume(input: {
  pendingToolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  workflowRun?: WorkflowRunState | null;
}): boolean {
  if (input.pendingToolCalls.length > 0 || !input.workflowRun?.currentNodeId) {
    return false;
  }
  const current = input.workflowRun.nodes.find(
    (row) => row.nodeId === input.workflowRun?.currentNodeId,
  );
  return current?.action === 'await_user_confirm';
}

export function shouldDeferPlanPresentWriteGate(input: {
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): boolean {
  return (
    resolveWriteConfirmationPolicy({
      workflowRun: input.workflowRun,
      workflowNodeDefs: input.workflowNodeDefs,
    }).kind === 'defer_to_workflow_await'
  );
}
