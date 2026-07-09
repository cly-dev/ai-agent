import { type SessionGoaPayload, type StoredTaskPlan, type TaskStepProgress } from './session-goa.types';
export type LegacySessionContextPayload = {
    sessionId: string;
    turns: unknown[];
    workingMemory?: {
        entities?: Record<string, unknown>;
    } | null;
    recentEpisodes?: unknown;
    sessionArtifacts?: unknown;
    taskState?: {
        turnId: number;
        runId: number;
        status: string;
        updatedAt?: string;
        steps?: Array<{
            stepId: string;
            phase: string;
            kind: string;
            status: TaskStepProgress['status'];
            summary?: string;
            artifactRef?: string;
        }>;
    } | null;
    resumeTaskPlan?: StoredTaskPlan | null;
    observationSnapshots?: unknown;
    updatedAt?: string;
};
export declare function migrateLegacyContextToGoa(sessionId: string, legacy: LegacySessionContextPayload): SessionGoaPayload;
