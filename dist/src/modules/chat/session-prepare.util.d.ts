import type { SessionAllowedToolsRow } from './session-prepare.types';
import type { RuntimeRevision } from '../../core/runtime-cache/runtime-cache.types';
export declare function buildSessionRuntimeRevision(input: {
    tools: SessionAllowedToolsRow[];
    skills: Array<{
        id: number;
        updatedAt?: Date | string;
    }>;
    hostToolsRevision?: string;
}): RuntimeRevision;
export declare function areSessionRuntimeRevisionsEqual(cached: RuntimeRevision | null | undefined, fresh: RuntimeRevision): boolean;
export declare function snapshotContainsAnyToolId(tools: Array<{
    id: number;
}>, toolIds: Iterable<number>): boolean;
export declare function isSessionRuntimeSnapshotValid(snapshot: {
    sessionId: string;
    userId: number;
    appClientId: number;
    agentId: number;
    tools: unknown[];
}, expected: {
    sessionId: string;
    userId: number;
    appClientId: number;
    agentId: number;
}): boolean;
