import type { RuntimeRevision } from '../../../core/runtime-cache/runtime-cache.types';
export declare class PrepareChatResponseDto {
    sessionId: string;
    prepared: boolean;
    agentReady: boolean;
    toolsCount: number;
    skillsCount: number;
    hostToolsCount: number;
    pageScope: string | null;
    sessionContextWarmed: boolean;
    warmedAt: string;
    fromCache: boolean;
    revision?: RuntimeRevision;
}
