import type {
  TaskDeliverable,
  TaskPlanSnapshot,
  TaskPlanStep,
} from '../agent-engine/engine/main/plan/task-plan.types';
import { syncPlanFromActiveFrame } from '../agent-engine/engine/main/plan/plan-stack.util';
import type { WorkflowNodeDef } from './workflow.types';

/** 由 Workflow 节点组合推导 Plan deliverable（compile / resume 物化 SSOT）。 */
export function inferDeliverableFromWorkflowNodes(
  nodes: WorkflowNodeDef[],
): TaskDeliverable {
  const actions = new Set(nodes.map((row) => row.action));
  if (
    actions.has('write_data') ||
    (actions.has('compose_mutation') && actions.has('await_user_confirm'))
  ) {
    return 'mutation';
  }
  return 'answer';
}

function workflowDefByStepId(
  nodes: WorkflowNodeDef[],
): Map<string, WorkflowNodeDef> {
  return new Map(nodes.map((row) => [row.id, row]));
}

/**
 * Workflow 绑定后校正 Plan 步 kind：
 * - await_user_confirm → workflow_gate
 * - summarize_images → workflow_inline（不进 ReAct）
 */
export function normalizeTaskPlanStepsForWorkflow(
  steps: TaskPlanStep[],
  nodes: WorkflowNodeDef[],
): TaskPlanStep[] {
  if (nodes.length === 0) {
    return steps;
  }
  const defs = workflowDefByStepId(nodes);
  return steps.map((step) => {
    const def = defs.get(step.id);
    if (def?.action === 'await_user_confirm' && step.kind !== 'workflow_gate') {
      return {
        ...step,
        kind: 'workflow_gate' as const,
        phase: step.phase ?? 'answer',
        stopWhen: step.stopWhen ?? 'always',
      };
    }
    if (
      def?.action === 'summarize_images' &&
      step.kind !== 'workflow_inline'
    ) {
      return {
        ...step,
        kind: 'workflow_inline' as const,
        phase: 'gather' as const,
        stopWhen: 'always' as const,
        workflowAction: 'summarize_images' as const,
      };
    }
    return step;
  });
}

function normalizeFramesForWorkflow(
  plan: TaskPlanSnapshot,
  nodes: WorkflowNodeDef[],
): TaskPlanSnapshot['frames'] {
  if (plan.frames.length === 0) {
    return plan.frames;
  }
  return plan.frames.map((frame) => ({
    ...frame,
    steps: normalizeTaskPlanStepsForWorkflow(frame.steps, nodes),
  }));
}

/**
 * Workflow 绑定 Plan 物化后的唯一规范化入口：
 * - await 步 kind → workflow_gate（含 DB 中历史 summarize 形态）
 * - deliverable 与 mutation 节点组合对齐
 */
export function normalizeTaskPlanSnapshotForWorkflow(input: {
  plan: TaskPlanSnapshot;
  nodes: WorkflowNodeDef[];
}): TaskPlanSnapshot {
  const { plan, nodes } = input;
  const inferred = inferDeliverableFromWorkflowNodes(nodes);
  const deliverable =
    plan.deliverable === 'answer' && inferred === 'mutation'
      ? inferred
      : plan.deliverable;
  const steps = normalizeTaskPlanStepsForWorkflow(plan.steps, nodes);
  const frames = normalizeFramesForWorkflow(plan, nodes);
  const next: TaskPlanSnapshot = {
    ...plan,
    deliverable,
    steps,
    frames,
  };
  return plan.frames.length > 0 ? syncPlanFromActiveFrame(next) : next;
}
