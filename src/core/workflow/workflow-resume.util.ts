import type { PrismaService } from '../../prisma/prisma.service';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { normalizeTaskPlanSnapshotForWorkflow } from './normalize-task-plan-for-workflow.util';
import { compileTaskPlanToWorkflowNodes } from './compile-plan-to-workflow.util';
import { loadWorkflowForRun } from './load-workflow-definition.util';
import {
  projectTaskPlanFromWorkflowRun,
  workflowNodeRequiresReactLoop,
} from './workflow-plan-sync.util';
import {
  advanceWorkflowRun,
  completeWorkflowNode,
  finalizeWorkflowRunAfterAdvance,
} from './workflow-run.util';
import type {
  WorkflowEdge,
  WorkflowNodeDef,
  WorkflowRunState,
} from './workflow.types';

export function isResumableWorkflowRun(
  run: WorkflowRunState | null | undefined,
): run is WorkflowRunState {
  if (!run) {
    return false;
  }
  if (run.status === 'completed' || run.status === 'cancelled') {
    return false;
  }
  return run.nodes.length > 0;
}

function nodeDefsCoverRun(
  defs: WorkflowNodeDef[],
  run: WorkflowRunState,
): boolean {
  const defIds = new Set(defs.map((row) => row.id));
  return run.nodes.every((row) => defIds.has(row.nodeId));
}

/**
 * Resume 解析整图：nodes +（DB 时）edges。
 * 边是推进真源；禁止只拿 defs 再靠 GOA 缺边快照合成线性。
 */
export type WorkflowResumeResolvedGraph = {
  nodes: WorkflowNodeDef[];
  /** DB load 成功时带回；plan 回退为 null → 保留 savedRun.edges */
  edges: WorkflowEdge[] | null;
};

export async function resolveWorkflowGraphForResume(
  prisma: PrismaService,
  input: {
    savedRun: WorkflowRunState;
    taskPlan: TaskPlanSnapshot;
    appClientId: number;
    scope?: {
      allowedToolIds: number[];
      allowedHostToolIds: number[];
    };
  },
): Promise<WorkflowResumeResolvedGraph | null> {
  if (input.savedRun.workflowId > 0) {
    const loaded = await loadWorkflowForRun(prisma, {
      workflowId: input.savedRun.workflowId,
      appClientId: input.appClientId,
      workflowVersion: input.savedRun.version,
      scope: input.scope,
    });
    if (loaded && nodeDefsCoverRun(loaded.nodes, input.savedRun)) {
      return { nodes: loaded.nodes, edges: loaded.edges };
    }
  }

  const fromPlan = compileTaskPlanToWorkflowNodes(input.taskPlan.steps);
  if (fromPlan.length > 0 && nodeDefsCoverRun(fromPlan, input.savedRun)) {
    return { nodes: fromPlan, edges: null };
  }

  const runNodeIds = new Set(input.savedRun.nodes.map((row) => row.nodeId));
  const matched = fromPlan.filter((row) => runNodeIds.has(row.id));
  return matched.length > 0 ? { nodes: matched, edges: null } : null;
}

export function shouldAwaitReactOnWorkflowResume(
  run: WorkflowRunState,
  defs: WorkflowNodeDef[],
): boolean {
  const nodeId = run.currentNodeId;
  if (!nodeId) {
    return false;
  }
  const nodeState = run.nodes.find((row) => row.nodeId === nodeId);
  if (nodeState?.status !== 'running' && nodeState?.status !== 'pending') {
    return false;
  }
  const def = defs.find((row) => row.id === nodeId);
  return workflowNodeRequiresReactLoop(def);
}

export type WorkflowResumeGraphSlice = {
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowAwaitingReact: boolean;
};

export function hydrateTaskPlanWithWorkflowDefs(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): TaskPlanSnapshot | null {
  if (!input.taskPlan || !input.workflowNodeDefs?.length) {
    return input.taskPlan ?? null;
  }
  return normalizeTaskPlanSnapshotForWorkflow({
    plan: input.taskPlan,
    nodes: input.workflowNodeDefs,
  });
}

/**
 * Workflow await_user_confirm 续跑：workflowRun 为 SSOT，投影 plan 镜像。
 */
export function prepareTaskPlanForWorkflowWriteConfirmResume(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRunBeforeAdvance: WorkflowRunState;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
  workflowRunAfterAdvance?: WorkflowRunState | null;
}): TaskPlanSnapshot | null {
  if (!input.taskPlan) {
    return null;
  }
  const workflowRun =
    input.workflowRunAfterAdvance ?? input.workflowRunBeforeAdvance;
  return projectTaskPlanFromWorkflowRun({
    taskPlan: input.taskPlan,
    workflowRun,
    workflowNodeDefs: input.workflowNodeDefs,
  });
}

export function advanceWorkflowRunAfterWriteConfirm(
  run: WorkflowRunState,
): WorkflowRunState {
  const currentId = run.currentNodeId;
  if (!currentId) {
    return run;
  }
  const current = run.nodes.find((row) => row.nodeId === currentId);
  if (
    !current ||
    (current.action !== 'await_user_confirm' && current.action !== 'write_data')
  ) {
    return run;
  }
  let next = completeWorkflowNode(
    run,
    currentId,
    `obs:write_confirm:${currentId}`,
  );
  next = advanceWorkflowRun(next);
  next = finalizeWorkflowRunAfterAdvance(next);
  return next;
}

export function workflowRunHasPendingNodes(
  run: WorkflowRunState | null | undefined,
): boolean {
  return run?.status === 'running' && run.currentNodeId != null;
}

/**
 * 组装 resume 切片：edges 写回 workflowRun（DB 真源），不另起一套路由状态。
 */
export function buildWorkflowResumeGraphSlice(input: {
  savedRun: WorkflowRunState;
  nodes: WorkflowNodeDef[];
  /** DB load 的边；省略则保留 savedRun.edges */
  edges?: WorkflowEdge[] | null;
}): WorkflowResumeGraphSlice {
  const workflowRun: WorkflowRunState =
    input.edges != null
      ? { ...input.savedRun, edges: input.edges }
      : input.savedRun;

  return {
    workflowRun,
    workflowNodeDefs: input.nodes,
    workflowAwaitingReact: shouldAwaitReactOnWorkflowResume(
      workflowRun,
      input.nodes,
    ),
  };
}
