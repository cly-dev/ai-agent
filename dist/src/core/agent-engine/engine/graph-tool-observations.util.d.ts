import type { AgentGraphState } from './main/types/agent-engine.types';
import type { ToolObservation } from './main/types/agent-engine.types';
export type ToolObservationRow = {
    name: string;
    output: unknown;
};
export type SplitToolObservationsInput = {
    workingMemory: ToolObservation[];
    currentRun: ToolObservation[];
};
export declare function preloadedToolObservations(state: Pick<AgentGraphState, 'preloadedToolObservations'>): ToolObservation[];
export declare function runOwnedToolObservations(state: Pick<AgentGraphState, 'toolObservations'>): ToolObservation[];
export declare function splitToolObservationsFromState(state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>): SplitToolObservationsInput;
export declare function allToolObservations(state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>): ToolObservation[];
export declare function formatSplitObservationsFromState(state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>): string;
export declare function mergeRunRoundObservations(state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>, mergedFromRound: ToolObservationRow[]): ToolObservation[];
