import type { ActiveTask, ObservationEntry, SessionArtifact, SessionGoaPayload, TurnEpisode } from './session-goa.types';
export type SessionGoaStorageLimits = {
    maxEpisodes: number;
    maxArtifacts: number;
    maxObservationLedgerEntries: number;
};
export declare function buildSessionGoaStorageLimits(): SessionGoaStorageLimits;
export declare function countRowsInObservationOutput(output: unknown): number | undefined;
export declare function summarizeObservationArgs(args: Record<string, unknown> | undefined): string;
export declare function mergeSessionObservationEntries(goa: SessionGoaPayload): ObservationEntry[];
export declare function formatSessionGoaCoverageForPrompt(): string;
export declare function formatRecentEpisodesForPrompt(episodes: TurnEpisode[]): string | null;
export declare function formatArtifactsForPrompt(artifacts: SessionArtifact[]): string | null;
export declare function formatObservationInventoryForPrompt(entries: ObservationEntry[], toolRoleByName?: ReadonlyMap<string, string>): string | null;
export declare function formatActiveTaskForPrompt(activeTask: ActiveTask | null | undefined): string | null;
export declare function formatEntitiesForPrompt(entities: Record<string, unknown> | undefined): string | null;
export declare function buildFullSessionGoaPromptMessages(payload: SessionGoaPayload, options?: {
    toolRoleByName?: ReadonlyMap<string, string>;
}): Array<{
    role: 'system';
    content: string;
}>;
