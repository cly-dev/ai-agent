import type { LlmChatMessage } from '../../llm/llm.types';
import type { AgentMachineCode } from './agent-run-user-messages.util';
export type RunMetricsAccumulator = {
    llmCallCount: number;
    gatherPageSummaryCallCount: number;
    toolCallCount: number;
    promptTokens: number;
    completionTokens: number;
    llmDurationMs: number;
    toolDurationMs: number;
    model?: string;
    toolsUsed: Set<string>;
    toolQualityCounts: {
        high: number;
        medium: number;
        low: number;
    };
    machineCodeCounts: Record<AgentMachineCode, number>;
    startedAtMs: number;
};
export type RunMetricsSnapshot = {
    llmCallCount: number;
    gatherPageSummaryCallCount: number;
    toolCallCount: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    llmDurationMs: number;
    toolDurationMs: number;
    durationMs: number;
    model?: string;
    toolsUsed: {
        names: string[];
        qualityCounts: {
            high: number;
            medium: number;
            low: number;
        };
        codeCounts: Record<AgentMachineCode, number>;
    };
};
export declare function createRunMetricsAccumulator(): RunMetricsAccumulator;
export declare function recordGatherPageSummaryLlmUsage(acc: RunMetricsAccumulator, input: {
    messages: LlmChatMessage[];
    outputText: string;
    durationMs: number;
    model?: string;
    responseMeta?: Record<string, unknown>;
}): void;
export declare function recordLlmUsage(acc: RunMetricsAccumulator, input: {
    messages: LlmChatMessage[];
    outputText: string;
    durationMs: number;
    model?: string;
    responseMeta?: Record<string, unknown>;
}): void;
export declare function recordToolUsage(acc: RunMetricsAccumulator, input: {
    name: string;
    latencyMs: number;
    quality?: 'high' | 'medium' | 'low';
}): void;
export declare function recordMachineCodeUsage(acc: RunMetricsAccumulator, code: AgentMachineCode | null | undefined): void;
export declare function snapshotRunMetrics(acc: RunMetricsAccumulator, finishedAtMs?: number): RunMetricsSnapshot;
export declare function aggregateRunMetrics(snapshots: RunMetricsSnapshot[]): RunMetricsSnapshot;
export declare function resolveFinishReason(input: {
    status: 'running' | 'success' | 'failed';
    steps: Array<{
        type: string;
        output?: unknown;
    }>;
    finishedEarly: boolean;
    error?: string;
}): string;
