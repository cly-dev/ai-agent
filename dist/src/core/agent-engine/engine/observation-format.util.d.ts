import type { ToolObservation } from './main/types/agent-engine.types';
export type ObservationPromptSource = 'session' | 'current_run';
export type LlmObservationPayload = {
    tool: string;
    executed: boolean;
    source?: ObservationPromptSource;
    internal?: boolean;
    args?: Record<string, unknown>;
    reuseNote?: string;
    success: boolean;
    summary?: Record<string, unknown>;
    records?: Record<string, unknown>[];
    error?: string;
};
export type SummarizeMemoryScopeMeta = {
    primarySource: 'current_run' | 'working_memory' | 'both' | 'none';
    reason: string;
    filterMiss?: boolean;
    workingMemoryCount: number;
    currentRunCount: number;
};
export type SplitToolObservationsOutput = {
    workingMemory: ToolObservation[];
    currentRun: ToolObservation[];
    memoryScope?: SummarizeMemoryScopeMeta;
};
export declare const SPLIT_TOOL_OBSERVATIONS_NAME = "split_tool_observations";
export declare function compactArgsForObservation(args: Record<string, unknown> | undefined): Record<string, unknown> | undefined;
export declare function formatObservationForLlm(input: {
    toolName: string;
    output: unknown;
    fieldLabels?: Record<string, string>;
    args?: Record<string, unknown>;
    source?: ObservationPromptSource;
}): LlmObservationPayload;
export declare function serializeObservationsBlock(payloads: LlmObservationPayload[]): string;
export declare function observationCallSignature(payload: Pick<LlmObservationPayload, 'tool' | 'args'>): string;
export declare function toolObservationsToPayloads(observations: ToolObservation[], source?: ObservationPromptSource): LlmObservationPayload[];
export declare function filterWorkingMemorySupersededByCurrentRun(workingMemory: LlmObservationPayload[], currentRun: LlmObservationPayload[]): LlmObservationPayload[];
export declare function formatSplitObservationsPromptBlock(input: {
    workingMemory: LlmObservationPayload[];
    currentRun: LlmObservationPayload[];
}): string;
export declare function isSplitToolObservationsOutput(output: unknown): output is SplitToolObservationsOutput;
export declare function formatSplitToolObservationsForSummarize(output: SplitToolObservationsOutput): string;
export declare function resolvePrimaryObservationForSummarize(output: unknown): ToolObservation | null;
export declare function isSameObservationPayload(left: LlmObservationPayload, right: LlmObservationPayload): boolean;
export declare function dedupeObservationPayloads(payloads: LlmObservationPayload[]): LlmObservationPayload[];
export declare function truncateObservationPayloads(payloads: LlmObservationPayload[], maxRecordsPerTool?: number): LlmObservationPayload[];
