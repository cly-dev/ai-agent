export declare class SessionRunStateResponseDto {
    generation: number;
    activeRunId: number | null;
    activeTurnId: number | null;
    pendingJobCount: number;
    redisBacked: boolean;
}
