import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { ToolExecutionStatus } from '../../tool/tool-execution-status.util';
import type { ToolObservation } from '../types/agent-engine.types';
import type { BuildTaskPlanInput, ResolveTaskPlanResult, TaskDeliverable, TaskPlanAdvanceResult, TaskPlanInitialAdvanceResult, TaskPlanSnapshot, TaskPlanSource, TaskPlanStep, PlanSummarizePublishMode } from './task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import type { PageContextUsage } from '../../../../host-bridge/page-context-usage.types';
import type { OuterPlanSkillSelectMethod } from './outer-plan-skill-resolve.util';
export type PlanScopedTool = {
    name: string;
    description: string;
    agentMetadata: unknown;
    responseProfile: unknown;
    method?: string;
};
export declare function parseSkillPlanConfig(config: unknown): {
    deliverable?: TaskDeliverable;
    workflowSteps?: TaskPlanStep[];
};
export declare const PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS = 2;
export declare function alignDeliverableWithScopedTools(deliverable: TaskDeliverable, scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries']): TaskDeliverable;
export declare function applyOuterPlanSelectMetadata(plan: TaskPlanSnapshot, meta: {
    outerSkillSelectMethod?: OuterPlanSkillSelectMethod;
    autoSelectedSkillId?: number | null;
}): TaskPlanSnapshot;
export declare function buildPlanSnapshot(input: {
    source: TaskPlanSource;
    userMessage: string;
    goal: string;
    deliverable: TaskDeliverable;
    steps: TaskPlanStep[];
    constraints?: string[];
}): TaskPlanSnapshot;
export declare function resolveOuterSkillPlanDeliverable(input: {
    skill: {
        config?: unknown;
        skillToolIds?: number[];
        hostToolIds?: number[];
        riskLevel?: BuildTaskPlanInput['skillRiskLevel'];
    };
    scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
    pageHostPrimary?: boolean;
}): TaskDeliverable;
export declare function planHasChitchatConstraint(plan: Pick<TaskPlanSnapshot, 'constraints'> | null | undefined): boolean;
export declare function buildChitchatPlanResult(input: {
    userMessage: string;
}): ResolveTaskPlanResult;
export declare function buildPageContextInlinePlanResult(input: {
    userMessage: string;
    pageContextUsage: PageContextUsage;
}): ResolveTaskPlanResult;
export declare function buildPageContextEntityReadPlanResult(input: {
    userMessage: string;
    scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
    pageContextUsage: PageContextUsage;
}): ResolveTaskPlanResult;
export declare function buildRequestedSkillOuterPlanResult(input: {
    userMessage: string;
    skill: {
        id: number;
        name: string;
        description: string | null;
        riskLevel: BuildTaskPlanInput['skillRiskLevel'];
        config?: unknown;
        skillToolIds?: number[];
        hostToolIds?: number[];
    };
    scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
    pageHostPrimary?: boolean;
    outerSkillSelectMethod?: ResolveTaskPlanResult['outerSkillSelectMethod'];
}): ResolveTaskPlanResult;
export declare function buildTaskPlan(input: BuildTaskPlanInput): TaskPlanSnapshot;
export declare function summarizeScopedToolsForPlan(tools: Array<{
    name: string;
    description: string;
    agentMetadata: unknown;
    responseProfile: unknown;
    method?: string;
}>): BuildTaskPlanInput['scopedToolSummaries'];
export type PlanExecutionContext = {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
};
export declare function planExecutionContextFromState(input: {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanExecutionContext;
export declare function workflowNodeActionForPlanStepId(workflowNodeDefs: WorkflowNodeDef[] | null | undefined, stepId: string | null | undefined): string | null;
export declare function resolvePlanExecutionStep(ctx: PlanExecutionContext): {
    step: TaskPlanStep | null;
    workflowNodeAction: string | null;
};
export declare function getPendingPlanStep(plan: TaskPlanSnapshot | null | undefined): TaskPlanStep | null;
export declare function resolveEffectivePlanStep(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState | null;
}): TaskPlanStep | null;
export declare function resolveEffectivePlanStepId(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState | null;
}): string | null;
export declare function getPendingPlanHostToolStep(plan: TaskPlanSnapshot | null | undefined, workflowRun?: WorkflowRunState | null): TaskPlanStep | null;
export type PlanStepExecutionRoute = 'llm' | 'summarize' | 'workflow' | 'terminal';
export declare function resolvePlanStepExecutionRoute(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): PlanStepExecutionRoute;
export declare function isPlanAwaitUserConfirmStep(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): boolean;
export declare function isPlanWorkflowGateStep(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): boolean;
export declare function isPlanStepBlockingToolScope(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): boolean;
export declare function isPlanTextGenerationStep(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): boolean;
export declare function getPendingPlanToolStep(plan: TaskPlanSnapshot | null | undefined, workflowRun?: WorkflowRunState | null): TaskPlanStep | null;
export declare function isPendingPlanAnswerStep(plan: TaskPlanSnapshot | null | undefined, workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): boolean;
export declare function listBusinessFieldsForPlanGatherStep(step: TaskPlanStep, scopedTools: PlanScopedTool[]): string[];
export type PlanToolStepSatisfactionPurpose = 'pre_tools_advance' | 'observation_bucket';
export declare function isPlanToolStepSatisfiedByObservations(input: {
    step: TaskPlanStep;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
    taskPlan?: TaskPlanSnapshot | null;
    skillConfig?: unknown;
    purpose?: PlanToolStepSatisfactionPurpose;
    pageContextEntityId?: string | null;
}): boolean;
export declare function countConsecutiveLlmRoundsWithoutToolCalls(steps: Array<{
    type: string;
    output?: unknown;
}>): number;
export declare function resolveScopedToolRoleForPlan(tool: PlanScopedTool): ToolDecisionRole;
export declare function filterScopedToolsForPlanStep<T extends PlanScopedTool>(tools: T[], taskPlan: TaskPlanSnapshot | null | undefined, workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): T[];
export declare function isPlanWriteToolRole(role: ToolDecisionRole | string | null | undefined): boolean;
export declare function isPlanWriteToolStep(step: TaskPlanStep | null | undefined): boolean;
export declare function resolveMutationWriteToolsForPresent<T extends PlanScopedTool>(scopedTools: T[], taskPlan: TaskPlanSnapshot | null | undefined, composedToolName?: string | null): T[];
export declare const PLAN_COMPOSE_WRITE_STEP_ID = "compose_write";
export declare const PLAN_PRESENT_STEP_ID = "present";
export declare const PLAN_WRITE_STEP_ID = "write";
export declare const WORKFLOW_PRESENT_MUTATION_STEP_ID = "present_mutation";
export declare const PLAN_DRAFT_STEP_ID = "draft";
type PresentSummarizeWorkflowNodeHint = {
    id: string;
    action: string;
};
export declare function isPlanComposeWriteStep(step: TaskPlanStep | null | undefined): boolean;
export declare function isComposeMutationParameterStep(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): boolean;
export declare function isPlanWriteFallbackStep(step: TaskPlanStep | null | undefined): boolean;
export declare function isPlanWriteExecutionStep(step: TaskPlanStep | null | undefined, workflowNodeAction?: string | null): boolean;
export declare function isPlanWriteExecutionStepInMutationFlow(step: TaskPlanStep | null | undefined): boolean;
export declare function isPlanPresentSummarizeStep(step: TaskPlanStep | null | undefined, workflowNodeDefs?: PresentSummarizeWorkflowNodeHint[] | null): boolean;
export declare function isCompliantMutationPlan(steps: TaskPlanStep[]): boolean;
export declare function advancePlanAfterStepComplete(plan: TaskPlanSnapshot, completedStepId: string): TaskPlanAdvanceResult;
export declare function buildMutationSteps(scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries']): TaskPlanStep[];
export declare function buildDeterministicMutationPlanSnapshot(input: {
    userMessage: string;
    goal?: string;
    scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
}): TaskPlanSnapshot;
export declare function shouldUseDeterministicMutationPlan(planInput: BuildTaskPlanInput): boolean;
export declare function buildDeterministicMutationPlanResult(input: {
    userMessage: string;
    goal: string;
    scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
    llmFallbackReason?: string;
}): ResolveTaskPlanResult;
export declare function scopedToolsIncludeWrite(scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries']): boolean;
export declare function shouldReplacePlanWithMutationTemplate(plan: TaskPlanSnapshot, hasWrite: boolean, planInput?: BuildTaskPlanInput): boolean;
export declare function toolCallMatchesPendingPlanToolRole(call: {
    name: string;
}, taskPlan: TaskPlanSnapshot, scopedTools: PlanScopedTool[]): boolean;
export declare function isTerminalEmptyToolRound(executionStatuses: ToolExecutionStatus[]): boolean;
export declare function resolveTaskPlanAfterTools(input: {
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    executionStatuses: ToolExecutionStatus[];
    roundObservationIndices: number[];
    scopedTools?: PlanScopedTool[];
    toolCalls?: Array<{
        name: string;
    }>;
    skillConfig?: unknown;
}): TaskPlanAdvanceResult | null;
export declare function resolveTaskPlanAdvanceWhenStepSatisfied(input: {
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
    skillConfig?: unknown;
    purpose?: PlanToolStepSatisfactionPurpose;
    pageContextEntityId?: string | null;
}): TaskPlanAdvanceResult | null;
export declare function resolveTaskPlanAdvance(input: {
    phase: 'post_tools';
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    executionStatuses: ToolExecutionStatus[];
    roundObservationIndices: number[];
    scopedTools?: PlanScopedTool[];
    toolCalls?: Array<{
        name: string;
    }>;
    skillConfig?: unknown;
} | {
    phase: 'pre_tools';
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
    skillConfig?: unknown;
    purpose?: PlanToolStepSatisfactionPurpose;
}): TaskPlanAdvanceResult | null;
export declare function finalizePlanAfterSummarize(plan: TaskPlanSnapshot | null | undefined): TaskPlanSnapshot | null;
export declare function shouldContinuePlanAfterSummarize(plan: TaskPlanSnapshot | null | undefined, workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): boolean;
export declare function resolveTaskPlanInitialAdvance(input: {
    plan: TaskPlanSnapshot;
    allObservations: ToolObservation[];
    runOwnedObservations: ToolObservation[];
    userMessage: string;
    planRunContext?: 'fresh' | 'resume';
    buildMergedObservation: (observations: ToolObservation[]) => ToolObservation | null;
}): TaskPlanInitialAdvanceResult | null;
export type ObservationsForPlanSummarizeResult = {
    observations: ToolObservation[];
    filterMiss: boolean;
};
export declare function filterObservationsForPlanSummarize(input: {
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
    strict?: boolean;
    workflowRun?: WorkflowRunState | null;
}): ObservationsForPlanSummarizeResult;
export declare function observationsForPlanSummarize(input: {
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
    workflowRun?: WorkflowRunState | null;
}): ToolObservation[];
export declare function completedGatherStepsSatisfiedInObservations(input: {
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
}): boolean;
export declare function buildPlanSummarizeObservation(input: {
    userMessage: string;
    summarizeObservation?: ToolObservation | null;
    merged?: ToolObservation | null;
}): ToolObservation;
export declare function resolveSummarizeUserMessageForPlan(latestUserMessage: string, plan: TaskPlanSnapshot | null | undefined): string;
export declare function isIntermediatePlanTextGenerationStep(plan: TaskPlanSnapshot | null | undefined): boolean;
export declare function resolvePlanSummarizePublishMode(plan: TaskPlanSnapshot | null | undefined): PlanSummarizePublishMode;
export declare function formatPlanContextForSummarize(plan: TaskPlanSnapshot | null | undefined): string | null;
export declare function buildDecisionUserFrame(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    observationCount: number;
    latestUserMessage: string;
}): LlmChatMessage | null;
export {};
