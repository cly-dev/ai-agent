import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import { SkillService } from '../../core/skill/skill.service';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { AgentToolCatalogService } from '../../core/runtime-cache/agent-tool-catalog.service';
import type { RuntimeRevision } from '../../core/runtime-cache/runtime-cache.types';
import { SessionPrepareStore } from './session-prepare.store';
import type { SessionAllowedToolsRow, SessionPrepareSkillRow } from './session-prepare.types';
export type SessionAllowedToolsBundle = {
    tools: SessionAllowedToolsRow[];
    skillRows: SessionPrepareSkillRow[];
    revision: RuntimeRevision;
    fromCache: boolean;
};
export declare class SessionRuntimeResolverService {
    private readonly prisma;
    private readonly agentService;
    private readonly skillService;
    private readonly sessionPrepareStore;
    private readonly hostToolCatalogService;
    private readonly agentToolCatalogService;
    private readonly inProcessBundles;
    constructor(prisma: PrismaService, agentService: AgentService, skillService: SkillService, sessionPrepareStore: SessionPrepareStore, hostToolCatalogService: AgentHostToolCatalogService, agentToolCatalogService: AgentToolCatalogService);
    invalidateSession(sessionId: string): void;
    resolveAllowedToolsBundle(input: {
        sessionId: string;
        agentId: number;
        userId: number;
        appClientId: number;
    }): Promise<SessionAllowedToolsBundle>;
    private loadFreshBundle;
    private fetchLightweightRevision;
    private loadSkillRevisionRows;
    private inProcessKey;
    private rememberInProcess;
}
