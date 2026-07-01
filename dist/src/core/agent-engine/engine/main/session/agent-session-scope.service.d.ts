import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SessionPrepareStore } from '../../../../../modules/chat/session-prepare.store';
import { AgentService } from '../../../../../modules/agent/agent.service';
import { IntentScopeService } from '../../../../intent/intent-scope.service';
import { SkillService } from '../../../../skill/skill.service';
import { ToolEngineService, type ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import { RuntimeCacheInvalidator } from '../../../../runtime-cache/runtime-cache-invalidator.service';
import { RunScopeCacheService } from '../../../../runtime-cache/run-scope-cache.service';
import { ToolCategoryCacheService } from '../../../../runtime-cache/tool-category-cache.service';
import { AgentHostToolCatalogService } from '../../../../runtime-cache/agent-host-tool-catalog.service';
import type { AgentEngineTool, ParsedIntentPayload, ScopedToolsResult } from '../types/agent-engine.types';
export declare class AgentSessionScopeService implements OnModuleInit {
    private readonly prisma;
    private readonly agentService;
    private readonly sessionPrepareStore;
    private readonly skillService;
    private readonly intentScopeService;
    private readonly toolEngine;
    private readonly invalidator;
    private readonly runScopeCache;
    private readonly toolCategoryCache;
    private readonly hostToolCatalogService;
    constructor(prisma: PrismaService, agentService: AgentService, sessionPrepareStore: SessionPrepareStore, skillService: SkillService, intentScopeService: IntentScopeService, toolEngine: ToolEngineService, invalidator: RuntimeCacheInvalidator, runScopeCache: RunScopeCacheService, toolCategoryCache: ToolCategoryCacheService, hostToolCatalogService: AgentHostToolCatalogService);
    onModuleInit(): void;
    fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]): Promise<import("../../../../runtime-cache/tool-category-cache.service").ToolCategoryCacheRow[]>;
    getSessionAllowedTools(sessionId: string, agentId: number, userId: number, appClientId: number): Promise<Awaited<ReturnType<AgentService['getAllowedTools']>>>;
    invalidateCachesForAgent(_agentId: number, sessionIds: string[]): void;
    invalidateCachesReferencingToolIds(toolIds: number[]): void;
    invalidateCachesForSession(sessionId: string): void;
    buildToolsRuntimeRevision(tools: AgentEngineTool[]): string;
    buildIntentScopeCacheKey(sessionId: string, matchedCategoryIds: number[], userMessage: string): string;
    resolveScopedToolsForIntent(input: {
        sessionId: string;
        userMessage: string;
        tools: AgentEngineTool[];
        toolBuildCtx: ToolBuildContext;
        matchedCategoryIds: number[];
    }): Promise<ScopedToolsResult & {
        fromCache: boolean;
    }>;
    filterToolsByIntent(tools: AgentEngineTool[], parsed: ParsedIntentPayload): AgentEngineTool[];
    scopeToolsForMainLoop(tools: AgentEngineTool[], userMessage: string, toolBuildCtx: ToolBuildContext, preferredCategoryIds?: number[]): Promise<ScopedToolsResult>;
    private loadSkillRevisionRows;
}
