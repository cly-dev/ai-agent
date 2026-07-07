import type { ToolLevel } from '../../../../../../generated/prisma/client';
import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { OuterPlanSkillSelectMethod } from './outer-plan-skill-resolve.util';
import type { PlanFrame } from './plan-stack.types';
export type TaskPlanSummaryObservation = {
    name: string;
    output: unknown;
    llmPayload?: unknown;
    quality?: 'high' | 'medium' | 'low';
    fieldLabels?: Record<string, string>;
    fieldDescriptions?: Record<string, string>;
    enumLabelsByPath?: Record<string, Record<string, string>>;
};
export type TaskPlanSource = 'workflow' | 'llm' | 'template' | 'minimal' | 'page_context';
export type TaskPlanResolveMethod = TaskPlanSource;
export type TaskDeliverable = 'analysis' | 'list' | 'detail' | 'mutation' | 'answer';
export type TaskStepKind = 'skill' | 'tool' | 'host_tool' | 'summarize' | 'reason' | 'workflow_gate';
export type TaskStepPhase = 'gather' | 'analyze' | 'answer' | 'mutate';
export type TaskStepStopWhen = 'observation_non_empty' | 'observation_fetch_complete' | 'observation_has_fields' | 'always';
export type TaskPlanStep = {
    id: string;
    phase: TaskStepPhase;
    kind: TaskStepKind;
    skillId?: number;
    toolRole?: ToolDecisionRole;
    hostToolNames?: string[];
    hostToolIds?: number[];
    objective: string;
    stopWhen?: TaskStepStopWhen;
};
export type TaskPlanSnapshot = {
    source: TaskPlanSource;
    originalUserRequest: string;
    goal: string;
    deliverable: TaskDeliverable;
    constraints: string[];
    steps: TaskPlanStep[];
    pendingStepIds: string[];
    completedStepIds: string[];
    taskPhase: TaskStepPhase;
    currentObjective: string;
    currentStepId: string | null;
    frames: PlanFrame[];
    activeFrameIndex: number;
    outerSkillSelectMethod?: OuterPlanSkillSelectMethod;
    autoSelectedSkillId?: number | null;
};
export type PlanHostToolSummary = {
    id?: number;
    name: string;
    description: string;
};
export type BuildTaskPlanInput = {
    userMessage: string;
    scopedToolSummaries: Array<{
        name: string;
        role: ToolDecisionRole;
    }>;
    availableHostTools?: PlanHostToolSummary[];
    skillApplied?: boolean;
    skillName?: string | null;
    skillDescription?: string | null;
    skillConfig?: unknown;
    skillRiskLevel?: ToolLevel | null;
    skillToolIds?: number[];
    skillHostToolIds?: number[];
};
export type TaskPlanInitialAdvanceResult = {
    updatedPlan: TaskPlanSnapshot;
    summaryObservation: TaskPlanSummaryObservation;
    reason: 'plan_initial_summarize';
};
export type PlanSummarizePublishMode = {
    artifactPhase: 'draft' | 'final';
    emitAuthoritativeFull: boolean;
};
export type TaskPlanAdvanceResult = {
    updatedPlan: TaskPlanSnapshot;
    route: 'summarize' | 'llm';
    reason: string;
};
export type ResolveTaskPlanResult = {
    plan: TaskPlanSnapshot;
    method: TaskPlanResolveMethod;
    llmFallbackReason?: string;
    droppedHostToolStepIds?: string[];
    outerSkillSelectMethod?: OuterPlanSkillSelectMethod;
    autoSelectedSkillId?: number | null;
};
export type PlanSessionEpisodeSummary = {
    turnId: number;
    runId: number;
    goal: string;
    outcome: string;
    status: string;
    toolsUsed: string[];
    artifactRefs: string[];
    metrics?: Record<string, string | number>;
    createdAt: string;
};
export type PlanSessionArtifactSummary = {
    id: string;
    turnId: number;
    kind: string;
    toolName?: string;
    stepId?: string;
    summary: string;
    meta?: Record<string, string | number>;
    createdAt: string;
};
export type PlanSessionObservationInventoryItem = {
    tool: string;
    runId: number;
    toolRole?: string;
    argsSummary: string;
    turnId: number;
    createdAt: string;
    rowCount?: number;
};
export type PlanSessionActiveTaskSummary = {
    status: string;
    goal: string;
    deliverable: string;
    originalUserRequest: string;
    pendingStepIds: string[];
    completedStepIds: string[];
    currentStepId: string | null;
    stepProgress: Array<{
        stepId: string;
        phase: string;
        kind: string;
        status: string;
        summary?: string;
        artifactRef?: string;
    }>;
};
export type PlanSessionWorkingMemory = {
    coverage: 'full_session_goa';
    storageLimits: {
        maxEpisodes: number;
        maxArtifacts: number;
        maxObservationLedgerEntries: number;
    };
    episodes: PlanSessionEpisodeSummary[];
    artifacts: PlanSessionArtifactSummary[];
    observationInventory: PlanSessionObservationInventoryItem[];
    satisfiedToolRoles: string[];
    entities?: Record<string, string>;
    activeTask?: PlanSessionActiveTaskSummary;
};
export type ResolveTaskPlanInput = BuildTaskPlanInput & {
    skillPrompt?: string | null;
    sessionWorkingMemory?: PlanSessionWorkingMemory | null;
    skillBoundWorkflowPlan?: TaskPlanSnapshot | null;
};
export type OuterPlanSkillSummary = {
    id: number;
    name: string;
    description: string | null;
    capabilityKey: string | null;
    riskLevel: ToolLevel;
    toolRoles: ToolDecisionRole[];
    hostToolIds: number[];
    runnableKind: 'http' | 'host' | 'both';
};
export type ResolveOuterPlanInput = {
    userMessage: string;
    scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
    availableHostTools?: PlanHostToolSummary[];
    availableSkills: OuterPlanSkillSummary[];
    sessionWorkingMemory?: PlanSessionWorkingMemory | null;
    requestedSkillId?: number;
    requestedSkillDetail?: {
        id: number;
        name: string;
        description: string | null;
        config: unknown;
        riskLevel: ToolLevel;
        skillToolIds?: number[];
        hostToolIds?: number[];
    };
};
