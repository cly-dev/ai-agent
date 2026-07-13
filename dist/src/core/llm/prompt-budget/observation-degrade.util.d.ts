import type { ObservationPayload } from './prompt-budget.types';
export declare function degradeObservations(observations: ObservationPayload[], level: 1 | 2 | 3): ObservationPayload[];
export declare function parseObservationsJson(raw: string): ObservationPayload[];
export declare function resolveObservationBlockPayload(raw: string): import('./prompt-budget.types').PromptBlockPayload;
export declare function serializeObservationsJson(observations: ObservationPayload[]): string;
