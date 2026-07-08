import type { HostToolDecisionDefinition } from '../../../../../host-bridge/host-tool-decision.types';
import type { AgentChatPageContext } from '../../../../../host-bridge/page-context.types';
import type { LlmChatMessage } from '../../../../../llm/llm.types';
import type { PlanSummarizePublishMode, TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../../workflow/workflow.types';
import type { ToolObservation, AgentEngineTool } from '../../types/agent-engine.types';
import type { AgentGraphDeps } from '../types/graph.types';
import { assessObservationQuality, buildDirectReplyObservation, buildPendingPlanSummaryObservation, buildSummarizeObservationFromState, isLowQualityToolObservation, resolveLlmCompletionAfterTools, resolveSummarizeStepMeta, resolveSummarizeStepName, resolveToolStepCode, assessObservationQualityForResume } from './observation.util';
import { summarizeClarificationRequest, summarizeSkillIntentMismatch, summarizeDirectLlmReply, summarizeDirectUserMessage, summarizePlanPresentWithPendingWrite, summarizeToolOutputForUser, summarizeWriteConfirmResume } from './stream.util';
import { type PlanReasonHostFillResult } from '../../plan-present/plan-reason-host-orchestrate.util';
export interface AgentGraphSummarizeHelpers {
    isLowQualityToolObservation: typeof isLowQualityToolObservation;
    assessObservationQuality: typeof assessObservationQuality;
    assessObservationQualityForResume: typeof assessObservationQualityForResume;
    resolveToolStepCode: typeof resolveToolStepCode;
    buildSummarizeObservationFromState: typeof buildSummarizeObservationFromState;
    buildPendingPlanSummaryObservation: typeof buildPendingPlanSummaryObservation;
    resolveLlmCompletionAfterTools: typeof resolveLlmCompletionAfterTools;
    buildDirectReplyObservation: typeof buildDirectReplyObservation;
    summarizeWriteConfirmResume: (input: Parameters<typeof summarizeWriteConfirmResume>[1]) => ReturnType<typeof summarizeWriteConfirmResume>;
    summarizeToolOutputForUser: (toolName: string, toolDescription: string | undefined, userMessage: string, output: unknown, fieldLabels: Record<string, string>, fieldDescriptions: Record<string, string>, enumLabelsByPath: Record<string, Record<string, string>>, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }, taskPlan?: TaskPlanSnapshot | null, agentMetadata?: unknown, executedArgs?: Record<string, unknown>, publishMode?: PlanSummarizePublishMode, sessionObservations?: ToolObservation[], workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null) => ReturnType<typeof summarizeToolOutputForUser>;
    summarizeDirectUserMessage: (userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }, taskPlan?: TaskPlanSnapshot | null, publishMode?: PlanSummarizePublishMode, workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null) => ReturnType<typeof summarizeDirectUserMessage>;
    summarizeClarificationRequest: (userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }, taskPlan?: TaskPlanSnapshot | null, publishMode?: PlanSummarizePublishMode) => ReturnType<typeof summarizeClarificationRequest>;
    summarizeSkillIntentMismatch: (userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }, publishMode?: PlanSummarizePublishMode) => ReturnType<typeof summarizeSkillIntentMismatch>;
    summarizeDirectLlmReply: (userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }) => ReturnType<typeof summarizeDirectLlmReply>;
    summarizePlanPresentWithPendingWrite: (toolName: string, toolDescription: string | undefined, userMessage: string, mergedObservation: ToolObservation, toolObservations: ToolObservation[], promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }, taskPlan?: TaskPlanSnapshot | null, scopedTools?: AgentEngineTool[], workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null) => ReturnType<typeof summarizePlanPresentWithPendingWrite>;
    runPlanReasonHostFill: (userMessage: string, mergedObservation: ToolObservation, toolObservations: ToolObservation[], promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
        appClientId: number;
        agentId: number;
    }, taskPlan: TaskPlanSnapshot, scopedHostTools: HostToolDecisionDefinition[], pageContext?: AgentChatPageContext | null, turnId?: number) => Promise<PlanReasonHostFillResult>;
    resolveSummarizeStepName: typeof resolveSummarizeStepName;
    resolveSummarizeStepMeta: typeof resolveSummarizeStepMeta;
}
export { assessObservationQuality, assessObservationQualityForResume, buildPendingPlanSummaryObservation, buildSummarizeObservationFromState, isLowQualityToolObservation, } from './observation.util';
export declare function createAgentGraphSummarizeHelpers(deps: AgentGraphDeps): AgentGraphSummarizeHelpers;
