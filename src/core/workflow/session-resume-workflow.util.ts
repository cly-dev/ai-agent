import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { compileTaskPlanToWorkflowNodes } from './compile-plan-to-workflow.util';
import {
  buildWorkflowResumeGraphSlice,
  isResumableWorkflowRun,
  type WorkflowResumeGraphSlice,
} from './workflow-resume.util';
import type { WorkflowRunState } from './workflow.types';

function nodeDefsCoverRun(
  defs: { id: string }[],
  run: WorkflowRunState,
): boolean {
  const defIds = new Set(defs.map((row) => row.id));
  return run.nodes.every((row) => defIds.has(row.nodeId));
}

/**
 * 会话续跑：从 GOA activeTask.workflowRun + 恢复的 taskPlan 预置 graph workflow 切片。
 * defs 由 taskPlan 编译；workflow-init 在已有切片时跳过 re-init。
 */
export function tryBuildSessionResumeWorkflowSlice(input: {
  workflowRun: WorkflowRunState | null | undefined;
  taskPlan: TaskPlanSnapshot;
}): WorkflowResumeGraphSlice | null {
  if (!isResumableWorkflowRun(input.workflowRun)) {
    return null;
  }
  const nodes = compileTaskPlanToWorkflowNodes(input.taskPlan.steps);
  if (nodes.length === 0 || !nodeDefsCoverRun(nodes, input.workflowRun)) {
    return null;
  }
  return buildWorkflowResumeGraphSlice({
    savedRun: input.workflowRun,
    nodes,
  });
}
