import type { AgentRunStep } from '../types/agent-engine.types';
export declare function maxRunStepNumber(steps: Array<{
    step?: number | string;
}>): number;
export declare function nextRunStepNumber(steps: Array<{
    step?: number | string;
}>): number;
export type TurnRunStepSlice = {
    runId: number;
    role: string;
    sequence: number;
    steps: AgentRunStep[];
};
export type TurnExecutionStep = AgentRunStep & {
    turnStep: number;
    sourceRunId: number;
    sourceRunRole: string;
};
export declare function mergeTurnExecutionSteps(runs: TurnRunStepSlice[]): TurnExecutionStep[];
export declare function parseAgentRunSteps(value: unknown): AgentRunStep[];
