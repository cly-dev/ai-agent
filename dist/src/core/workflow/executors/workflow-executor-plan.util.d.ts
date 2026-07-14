import type { TaskPlanSnapshot } from '../../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowExecutorContext } from './workflow-executor.types';
export declare function projectedTaskPlanForExecutor(ctx: WorkflowExecutorContext): TaskPlanSnapshot | null | undefined;
