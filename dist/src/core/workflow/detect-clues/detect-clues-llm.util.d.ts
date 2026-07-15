import type { LlmService } from '../../llm/llm.service';
import type { DetectCluesOutput, WorkflowClueDef } from '../workflow.types';
export declare function buildDetectCluesUserPayload(input: {
    objective: string;
    hint?: string;
    clues: WorkflowClueDef[];
    userMessage: string;
    pageContextSummary: string;
    priorOutputsSummary: string;
}): string;
export declare function invokeDetectCluesLlm(input: {
    llmService: LlmService;
    objective: string;
    hint?: string;
    clues: WorkflowClueDef[];
    userMessage: string;
    pageContextSummary: string;
    priorOutputsSummary: string;
}): Promise<DetectCluesOutput | null>;
