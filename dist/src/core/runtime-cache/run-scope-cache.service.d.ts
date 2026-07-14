import type { HostToolDecisionDefinition } from '../host-bridge';
import type { CachedScopedToolsEntry } from '../agent-engine/engine/main/types/agent-engine.types';
import type { ScopedToolsResult } from '../agent-engine/engine/main/types/agent-engine.types';
type IntentScopedCacheEntry = CachedScopedToolsEntry;
export declare class RunScopeCacheService {
    private readonly hostToolsByRun;
    private readonly intentScopedBySession;
    getHostToolsForRun(runId: number, pageScope: string, skillId: number | null | undefined): HostToolDecisionDefinition[] | null;
    setHostToolsForRun(runId: number, pageScope: string, skillId: number | null | undefined, tools: HostToolDecisionDefinition[]): void;
    clearHostToolsForRun(runId: number): void;
    getIntentScoped(cacheKey: string, toolFingerprint: string): IntentScopedCacheEntry | null;
    setIntentScoped(cacheKey: string, toolFingerprint: string, value: ScopedToolsResult): void;
    clearForSession(sessionId: string): void;
    clearIntentReferencingToolIds(toolIds: number[]): void;
    clearAllIntent(): void;
    private hostToolKey;
    private pruneHostTools;
    private pruneIntent;
}
export {};
