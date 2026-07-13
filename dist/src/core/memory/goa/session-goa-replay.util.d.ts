import type { ActiveTask, AgentRunGoaSnapshot, ObservationEntry, StoredTaskPlan } from './session-goa.types';
type ReplayTaskPlanTrace = {
    source: string;
    deliverable: string;
    goal: string;
    originalUserRequest: string;
    currentStepId: string | null;
    currentObjective: string;
    taskPhase: string;
    pendingStepIds: string[];
    completedStepIds: string[];
    steps: StoredTaskPlan['steps'];
};
export declare function extractLatestTaskPlanTraceFromSteps(steps: unknown, originalUserRequest: string): ReplayTaskPlanTrace | null;
export declare function extractObservationLogFromRunSteps(input: {
    turnId: number;
    runId: number;
    steps: unknown;
}): ObservationEntry[];
export declare function buildReplayActiveTask(input: {
    turnId: number;
    runId: number;
    userInput: string;
    runStatus: string;
    trace: ReplayTaskPlanTrace;
    observationLog: ObservationEntry[];
}): ActiveTask | null;
export type ReplayRunRow = {
    id: number;
    turnId: number;
    steps: unknown;
    status: string;
    goaSnapshot?: unknown;
};
export declare function buildActiveTaskFromGoaSnapshot(input: {
    turnId: number;
    runId: number;
    runStatus: string;
    snapshot: AgentRunGoaSnapshot;
    observationLog: ObservationEntry[];
}): ActiveTask | null;
export declare function replayActiveTaskFromRuns(input: {
    runs: ReplayRunRow[];
    turnUserInputById: Map<number, string>;
}): ActiveTask | null;
export {};
