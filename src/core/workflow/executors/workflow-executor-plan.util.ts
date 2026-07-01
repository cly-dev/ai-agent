import type { TaskPlanSnapshot } from '../../agent-engine/engine/main/plan/task-plan.types';
import { projectTaskPlanFromWorkflowRun } from '../workflow-plan-sync.util';
import { requireChatExecutorHost } from './executor-host.util';
import type { WorkflowExecutorContext } from './workflow-executor.types';

/** Executor 内构建 summarize 观测等时使用的投影 plan（execute_node 会再次统一投影）。 */
export function projectedTaskPlanForExecutor(
  ctx: WorkflowExecutorContext,
): TaskPlanSnapshot | null | undefined {
  const chat = requireChatExecutorHost(ctx.host);
  return (
    projectTaskPlanFromWorkflowRun({
      taskPlan: chat.state.taskPlan,
      workflowRun: ctx.workflowRun,
      workflowNodeDefs: chat.state.workflowNodeDefs,
    }) ?? chat.state.taskPlan
  );
}
