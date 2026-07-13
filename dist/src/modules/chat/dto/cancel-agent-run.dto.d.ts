export declare class CancelAgentRunDto {
    runId?: number;
}
export declare class CancelAgentRunResponseDto {
    superseded: boolean;
    generation: number;
    cancelledRunId: number | null;
}
