export type ToolCallLike = {
    name: string;
    arguments: Record<string, unknown>;
};
export declare function stableSerializeToolCallArgs(args: Record<string, unknown>): string;
export declare function toolCallSignature(call: ToolCallLike): string;
export declare function getLastToolRoundFromSteps(steps: Array<{
    type: string;
    step?: number;
    name?: string;
    input?: unknown;
}>): ToolCallLike[];
export declare function areToolCallRoundsIdentical(current: ToolCallLike[], previous: ToolCallLike[]): boolean;
export declare function getExecutedToolCallSignaturesFromSteps(steps: Array<{
    type: string;
    name?: string;
    input?: unknown;
    output?: unknown;
}>): Set<string>;
export declare function partitionToolCallsByHistory(calls: ToolCallLike[], steps: Array<{
    type: string;
    name?: string;
    input?: unknown;
    output?: unknown;
}>): {
    novel: ToolCallLike[];
    duplicates: ToolCallLike[];
};
