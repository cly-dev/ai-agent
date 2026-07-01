import type { Response } from 'express';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { SummarizeNodeInput } from '../workflow/workflow-node-input.types';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
export type PageWorkflowSummarizeResult = {
    summaryText: string;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    emittedLifecycle: boolean;
};
export declare function shouldEmitPageSummarizeLifecycle(input: {
    mode: SummarizeNodeInput['mode'];
    existingFillText: string;
    summaryText: string;
    responseWritable: boolean;
}): boolean;
export declare function executePageWorkflowSummarize(input: {
    llmService: LlmService;
    messages: LlmChatMessage[];
    nodeInput: SummarizeNodeInput;
    res: Response;
    actionRunId: number;
    actionKey: string;
    generation: number;
    clientActionId?: string | null;
    existingFillText: string;
    stepRecorder?: PageActionRunStepRecorder;
}): Promise<PageWorkflowSummarizeResult>;
