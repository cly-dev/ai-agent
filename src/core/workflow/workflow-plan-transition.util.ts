import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import { advancePlanAfterStepComplete } from '../agent-engine/engine/main/plan/task-plan.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';
import {
  deriveWorkflowAwaitingReact,
  mirrorWorkflowRunAfterPlanAdvance,
  projectTaskPlanFromWorkflowRun,
} from './workflow-plan-sync.util';

export function isWorkflowBoundRun(
  workflowRun?: WorkflowRunState | null,
): boolean {
  return (
    workflowRun?.status === 'running' && workflowRun.currentNodeId != null
  );
}

export type WorkflowPlanTransitionOptions = {
  clearWorkflowAwaitingReact?: boolean;
};

/**
 * Workflow 终极态：planAdvance 仅作「步完成」判定；写入 workflowRun，再投影 taskPlan。
 * 非 workflow 路径仍直接返回 updatedPlan。
 */
export function applyPlanAdvanceAsWorkflowProgress(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
  workflowAwaitingReact?: boolean;
  planBefore: TaskPlanSnapshot;
  planAdvance: TaskPlanAdvanceResult | null;
  options?: WorkflowPlanTransitionOptions;
}): {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRun?: WorkflowRunState;
  workflowAwaitingReact?: boolean;
} {
  if (!input.planAdvance) {
    return { taskPlan: input.taskPlan };
  }
  if (!isWorkflowBoundRun(input.workflowRun)) {
    return { taskPlan: input.planAdvance.updatedPlan };
  }

  const workflowRun = mirrorWorkflowRunAfterPlanAdvance({
    workflowRun: input.workflowRun!,
    planBefore: input.planBefore,
    planAdvance: input.planAdvance,
  });
  const taskPlan =
    projectTaskPlanFromWorkflowRun({
      taskPlan: input.planBefore,
      workflowRun,
      workflowNodeDefs: input.workflowNodeDefs,
    }) ?? input.planAdvance.updatedPlan;

  let workflowAwaitingReact = input.workflowAwaitingReact;
  if (input.options?.clearWorkflowAwaitingReact) {
    workflowAwaitingReact = false;
  } else {
    workflowAwaitingReact = deriveWorkflowAwaitingReact({
      workflowRun,
      workflowNodeDefs: input.workflowNodeDefs,
    });
  }

  return { taskPlan, workflowRun, workflowAwaitingReact };
}

/** compose_mutation 拦截：存 plan_compose_write + 完成 workflow 步 + 投影 plan。 */
export function applyComposeMutationProgress(input: {
  taskPlan: TaskPlanSnapshot;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
  workflowAwaitingReact?: boolean;
  planStepId: string;
  composeObservation: ToolObservation;
}): {
  taskPlan: TaskPlanSnapshot;
  workflowRun?: WorkflowRunState;
  workflowAwaitingReact?: boolean;
  composeObservation: ToolObservation;
} {
  const planBefore = input.taskPlan;
  const planAdvance = advancePlanAfterStepComplete(planBefore, input.planStepId);
  const progressed = applyPlanAdvanceAsWorkflowProgress({
    taskPlan: planBefore,
    workflowRun: input.workflowRun,
    workflowNodeDefs: input.workflowNodeDefs,
    workflowAwaitingReact: input.workflowAwaitingReact,
    planBefore,
    planAdvance,
    options: { clearWorkflowAwaitingReact: true },
  });
  return {
    taskPlan: (progressed.taskPlan ?? planAdvance.updatedPlan) as TaskPlanSnapshot,
    workflowRun: progressed.workflowRun,
    workflowAwaitingReact: progressed.workflowAwaitingReact,
    composeObservation: input.composeObservation,
  };
}
