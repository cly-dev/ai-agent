import type { ToolObservation } from './main/types/agent-engine.types';
import type { TaskPlanSnapshot } from './main/plan/task-plan.types';
import type { ToolRoundMeta } from './tool/tool-result-check.util';
export type WriteConfirmResumeOperation = {
    toolName: string;
    toolDescription?: string;
    status: 'SUCCESS' | 'ERROR';
    errorHint?: string;
    errorResponseSource?: string;
};
export type WriteConfirmResumeSummaryPayload = {
    userMessage: string;
    outcome: 'success' | 'failed';
    operations: WriteConfirmResumeOperation[];
    successCount: number;
    failureCount: number;
    totalCount: number;
};
export declare function buildWriteConfirmResumeSummaryPayload(input: {
    userMessage: string;
    writeRoundMeta: ToolRoundMeta;
    observations: ToolObservation[];
    scopedTools: Array<{
        name: string;
        description?: string;
    }>;
}): WriteConfirmResumeSummaryPayload;
export declare function buildWriteConfirmResumeSummaryObservation(input: {
    userMessage: string;
    writeRoundMeta: ToolRoundMeta;
    observations: ToolObservation[];
    scopedTools: Array<{
        name: string;
        description?: string;
    }>;
}): ToolObservation;
export declare function isWriteConfirmResumeSummaryObservation(observation: ToolObservation | null | undefined): observation is ToolObservation & {
    name: 'write_confirm_resume';
};
export declare function formatWriteConfirmResumeSummarizeUserMessage(input: {
    payload: WriteConfirmResumeSummaryPayload;
    taskPlan?: TaskPlanSnapshot | null;
    toolResultsJson?: string;
}): string;
