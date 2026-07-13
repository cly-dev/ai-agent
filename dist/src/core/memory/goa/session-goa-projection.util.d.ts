import type { ActiveTask, ObservationEntry, SessionArtifact, SessionArtifactKind, SessionGoaPayload, SessionMemoryUpdateContext, TurnEpisode } from './session-goa.types';
export declare function artifactIdFor(turnId: number, runId: number, stepId: string, kind: SessionArtifactKind): string;
export declare function buildArtifactsFromAgentRun(ctx: SessionMemoryUpdateContext): SessionArtifact[];
export declare function buildTurnEpisodeFromAgentRun(ctx: SessionMemoryUpdateContext, artifacts: SessionArtifact[]): TurnEpisode;
export declare function buildActiveTaskFromAgentRun(input: {
    ctx: SessionMemoryUpdateContext;
    artifacts: SessionArtifact[];
    prev: ActiveTask | null;
}): ActiveTask | null;
export declare function buildObservationEntriesFromContext(ctx: SessionMemoryUpdateContext): ObservationEntry[];
export declare function appendObservationEntries(existing: ObservationEntry[], incoming: ObservationEntry[]): ObservationEntry[];
export declare function resolvePersistedActiveTask(input: {
    base: SessionGoaPayload;
    built: ActiveTask | null;
    ctx: SessionMemoryUpdateContext;
}): ActiveTask | null;
export declare function mergeSessionEntities(prev: Record<string, unknown>, userInput: string): Record<string, unknown>;
export declare function mergeTurnEpisodes(existing: TurnEpisode, incoming: TurnEpisode): TurnEpisode;
export declare function appendEpisodeFifo(existing: TurnEpisode[], episode: TurnEpisode): TurnEpisode[];
export declare function appendArtifactsFifo(existing: SessionArtifact[], incoming: SessionArtifact[]): SessionArtifact[];
export declare function collectArtifactRefsForPrompt(input: {
    episodes: TurnEpisode[];
    activeTask: ActiveTask | null | undefined;
    maxEpisodes?: number;
}): string[];
export declare function flattenObservationLog(log: ObservationEntry[]): Array<{
    name: string;
    output: unknown;
}>;
export { buildFullSessionGoaPromptMessages, buildSessionGoaStorageLimits, formatActiveTaskForPrompt, formatArtifactsForPrompt, formatEntitiesForPrompt, formatObservationInventoryForPrompt, formatRecentEpisodesForPrompt, formatSessionGoaCoverageForPrompt, mergeSessionObservationEntries, } from './session-goa-full-projection.util';
export declare function formatGoaContextHint(episodes: TurnEpisode[], activeTask: ActiveTask | null | undefined): string;
export declare function formatGoaForHistoryCompression(payload: SessionGoaPayload): string;
