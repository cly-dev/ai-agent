import { PROMPT_KEYS } from '../../../../../prompt/prompt-template.keys';
import type { MessageBlock } from '../../../message/message-blocks.types';
import { classifySummarizeScenario } from '../../../user-response-style.util';
import type { AgentMachineCode } from '../../../agent-run-user-messages.util';
import type { SkillIntentMismatchCode } from '../../../turn/skill-intent-alignment.types';
import type { WriteConfirmResumeSummaryPayload } from '../../../write-confirm-resume-summary.util';
import type { TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../../workflow/workflow.types';
import type { AgentGraphState, AgentRunStep, ToolObservation } from '../../types/agent-engine.types';
export declare function isLowQualityToolObservation(observation: ToolObservation | undefined): boolean;
export declare function assessObservationQuality(output: unknown, agentMetadata?: unknown): 'high' | 'medium' | 'low';
export declare function hasBusinessKeySignal(row: Record<string, unknown>): boolean;
export declare function resolveToolStepCode(quality: 'high' | 'medium' | 'low', output: unknown, agentMetadata?: unknown): AgentMachineCode | null;
export declare function filterUsableToolObservations(observations: ToolObservation[]): ToolObservation[];
export declare function buildSummarizeObservationFromState(state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations' | 'workflowRun' | 'planRunContext' | 'workflowNodeOutputs'>, planContext?: {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools?: AgentGraphState['scopedTools'];
    workflowNodeDefs?: AgentGraphState['workflowNodeDefs'];
}): ToolObservation | null;
export declare function resolveLlmCompletionAfterTools(userMessage: string, llmText: string, state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>, planContext?: {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools?: AgentGraphState['scopedTools'];
}): {
    observation: ToolObservation;
} | null;
export declare function buildDirectReplyObservation(userMessage: string, draftReply: string): ToolObservation;
export declare function extractDirectReplyDraft(output: unknown): string;
export declare function extractDirectUserGuidanceHint(output: unknown): string | undefined;
export declare function parseClarificationRequestOutput(output: unknown): {
    missingFields: Array<{
        name: string;
        hint: string;
    }>;
    planStepId?: string;
    toolRole?: string;
};
export declare function parseSkillIntentMismatchOutput(output: unknown): {
    userMessage: string;
    mismatchCode: SkillIntentMismatchCode | null;
    requestedSkillId: number | null;
    requestedSkillName: string | null;
    routingReason: string | null;
};
export declare function buildSkillIntentMismatchFallbackPlainText(input: {
    mismatchCode: SkillIntentMismatchCode | null;
    requestedSkillName: string | null;
}): string;
export declare function resolveSummarizeStepName(taskPlan: TaskPlanSnapshot | null | undefined, observationName: string): string;
export declare function resolveSummarizeStepMeta(observation: ToolObservation): AgentRunStep['meta'] | undefined;
export declare function resolveSummarizePromptKey(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    fullDetail: boolean;
    summarizeScenario: ReturnType<typeof classifySummarizeScenario>;
}): (typeof PROMPT_KEYS)[keyof typeof PROMPT_KEYS];
export declare function buildSummarizeFallbackPlainText(toolName: string, output: unknown, ruleBlocks: MessageBlock[]): string;
export declare function buildWriteConfirmResumeFallbackPlainText(payload: WriteConfirmResumeSummaryPayload): string;
export declare function buildWriteConfirmResumeFallbackBlocks(payload: WriteConfirmResumeSummaryPayload): MessageBlock[];
export declare function assessObservationQualityForResume(output: unknown, agentMetadata?: unknown): 'high' | 'medium' | 'low';
export declare function buildPendingPlanSummaryObservation(userMessage: string, state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>, planContext?: {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools?: AgentGraphState['scopedTools'];
}): ToolObservation;
