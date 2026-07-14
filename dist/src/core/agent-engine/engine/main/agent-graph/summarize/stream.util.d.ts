import type { LlmChatMessage } from '../../../../../llm/llm.types';
import type { WriteConfirmResumeSummaryPayload } from '../../../write-confirm-resume-summary.util';
import type { PlanSummarizePublishMode, TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../../workflow/workflow.types';
import type { PlanPresentSummarizeResult } from '../../plan-present/plan-draft-summarize.util';
import type { AgentEngineTool, ToolObservation } from '../../types/agent-engine.types';
import type { AgentGraphDeps } from '../types/graph.types';
export declare function summarizeWriteConfirmResume(deps: AgentGraphDeps, input: {
    payload: WriteConfirmResumeSummaryPayload;
    mergedToolOutput: unknown;
    toolResultsText?: string;
    confirmedPreviewSerialized: string | null;
    promptMessages: LlmChatMessage[];
    sessionId: string;
    runId: number;
    turnId: number;
    scope: {
        appClientId: number;
        agentId: number;
    };
    taskPlan?: TaskPlanSnapshot | null;
}): Promise<string>;
export declare function summarizeDirectLlmReply(deps: AgentGraphDeps, userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
    appClientId: number;
    agentId: number;
}): Promise<string>;
export declare function summarizeClarificationRequest(deps: AgentGraphDeps, userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
    appClientId: number;
    agentId: number;
}, taskPlan?: TaskPlanSnapshot | null, publishMode?: PlanSummarizePublishMode): Promise<string>;
export declare function summarizeSkillIntentMismatch(deps: AgentGraphDeps, userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
    appClientId: number;
    agentId: number;
}, publishMode?: PlanSummarizePublishMode): Promise<string>;
export declare function summarizeDirectUserMessage(deps: AgentGraphDeps, userMessage: string, output: unknown, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
    appClientId: number;
    agentId: number;
}, taskPlan?: TaskPlanSnapshot | null, publishMode?: PlanSummarizePublishMode, workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): Promise<string>;
export declare function summarizePlanPresentWithPendingWrite(deps: AgentGraphDeps, toolName: string, toolDescription: string | undefined, userMessage: string, mergedObservation: ToolObservation, toolObservations: ToolObservation[], promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
    appClientId: number;
    agentId: number;
}, taskPlan: TaskPlanSnapshot | null | undefined, scopedTools: AgentEngineTool[], workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): Promise<PlanPresentSummarizeResult>;
export declare function summarizeToolOutputForUser(deps: AgentGraphDeps, toolName: string, toolDescription: string | undefined, userMessage: string, output: unknown, fieldLabels: Record<string, string>, fieldDescriptions: Record<string, string>, enumLabelsByPath: Record<string, Record<string, string>>, promptMessages: LlmChatMessage[], sessionId: string, runId: number, scope: {
    appClientId: number;
    agentId: number;
}, taskPlan?: TaskPlanSnapshot | null, agentMetadata?: unknown, executedArgs?: Record<string, unknown>, publishMode?: PlanSummarizePublishMode, sessionObservations?: ToolObservation[], workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): Promise<string>;
