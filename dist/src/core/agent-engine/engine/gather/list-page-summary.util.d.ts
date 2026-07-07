import { z } from 'zod';
import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import type { ListPageSummary } from './list-map-reduce.types';
import type { RunMetricsAccumulator } from '../run-metrics.util';
declare const pageSummarySchema: z.ZodObject<{
    keyFindings: z.ZodArray<z.ZodString>;
    distributions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        dimension: z.ZodString;
        counts: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            count: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>>>;
    notableExamples: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        note: z.ZodString;
    }, z.core.$strip>>>>;
    dataQualityNotes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export type PageSummaryLlmResult = z.infer<typeof pageSummarySchema>;
export type PageSummaryFailureReason = 'structured_output_failed' | 'fallback_chat_failed' | 'json_parse_failed' | 'schema_validation_failed' | 'unexpected_exception';
export type PageSummaryLlmAttempt = {
    ok: true;
    summary: PageSummaryLlmResult;
} | {
    ok: false;
    reason: PageSummaryFailureReason;
    detail: string;
    rawContentPreview?: string;
};
export declare function resolveMapLlmMaxConcurrent(): number;
export type PreparedPageSummaryRows = {
    rows: Record<string, unknown>[];
    originalRowCount: number;
    analyzedRowCount: number;
    rowsTruncatedForLlm: boolean;
};
export declare function prepareRowsForPageSummary(rows: Record<string, unknown>[]): PreparedPageSummaryRows;
export type SummarizeListPageInput = {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    page: number;
    rows: Record<string, unknown>[];
    fieldLabels: Record<string, string>;
    fieldDescriptions?: Record<string, string>;
    enumLabelsByPath?: Record<string, Record<string, string>>;
    currentObjective?: string;
    runMetrics?: RunMetricsAccumulator;
    runId?: number;
    sessionId?: string;
    iteration?: number;
    toolName?: string;
    onDebugLog?: (message: string) => void;
};
export declare function summarizeListPageWithLlm(input: SummarizeListPageInput): Promise<PageSummaryLlmAttempt>;
export type PageSummaryScheduleInput = SummarizeListPageInput & {
    onScheduled?: (page: number) => void;
};
export declare class ListPageSummaryPipeline {
    private readonly tasks;
    private readonly summaries;
    private readonly semaphore;
    constructor(maxConcurrent?: number);
    schedule(input: PageSummaryScheduleInput): void;
    awaitAll(): Promise<ListPageSummary[]>;
}
export {};
