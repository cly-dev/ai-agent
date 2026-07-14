import type { ObservationEntry, SessionGoaPayload } from './session-goa.types';
export declare function sessionLedgerEntryKey(row: ObservationEntry): string;
export declare function isLedgerEligibleObservation(row: {
    name: string;
    output: unknown;
}): boolean;
export declare function appendSessionObservationLedger(existing: ObservationEntry[], incoming: ObservationEntry[]): ObservationEntry[];
export declare function buildObservationLedgerEntriesFromContext(input: {
    turnId: number;
    runId: number;
    newToolObservations: Array<{
        name: string;
        output: unknown;
        args?: Record<string, unknown>;
    }>;
}): ObservationEntry[];
export declare function mergePriorToolObservationsFromGoa(payload: SessionGoaPayload | null): Array<{
    name: string;
    output: unknown;
}>;
