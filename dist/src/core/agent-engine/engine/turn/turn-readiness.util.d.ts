import type { WorkflowRunState } from '../../../workflow/workflow.types';
import { type PlanScopedTool } from '../main/plan/task-plan.util';
import { type PlanObservationBuckets } from '../main/plan/plan-observation-scope.util';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { PageContextUsage } from '../../../host-bridge/page-context-usage.types';
import type { TurnReadinessResult } from './turn-respond.types';
export type EvaluateExecutionReadinessInput = {
    userMessage: string;
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: PlanScopedTool[];
    skillConfig?: unknown;
    resumeFromWriteConfirm?: boolean;
    pageContext?: AgentChatPageContext | null;
    pageContextUsage?: Pick<PageContextUsage, 'applies' | 'entityId'> | null;
    observationBuckets: PlanObservationBuckets;
    workflowRun?: WorkflowRunState | null;
};
export declare function evaluateExecutionReadiness(input: EvaluateExecutionReadinessInput): Promise<TurnReadinessResult>;
