import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
export declare function compactWorkflowNodeOutputForSummarize(ref: string, value: unknown): unknown;
export declare function workflowNodeOutputsToSummarizeObservations(nodeOutputs: Record<string, unknown> | undefined): ToolObservation[];
export declare function formatPriorOutputsForDetectClues(priorOutputs: Record<string, unknown>, maxLen?: number): string;
