import { OnModuleInit } from '@nestjs/common';
import { SessionRuntimeResolverService } from '../../../../../modules/chat/session-runtime-resolver.service';
import { IntentScopeService } from '../../../../intent/intent-scope.service';
import { ToolEngineService, type ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import { RuntimeCacheInvalidator } from '../../../../runtime-cache/runtime-cache-invalidator.service';
import { RunScopeCacheService } from '../../../../runtime-cache/run-scope-cache.service';
import { ToolCategoryCacheService } from '../../../../runtime-cache/tool-category-cache.service';
import type { AgentEngineTool, ParsedIntentPayload, ScopedToolsResult } from '../types/agent-engine.types';
export declare class AgentSessionScopeService implements OnModuleInit {
    private readonly sessionRuntimeResolver;
    private readonly intentScopeService;
    private readonly toolEngine;
    private readonly invalidator;
    private readonly runScopeCache;
    private readonly toolCategoryCache;
    constructor(sessionRuntimeResolver: SessionRuntimeResolverService, intentScopeService: IntentScopeService, toolEngine: ToolEngineService, invalidator: RuntimeCacheInvalidator, runScopeCache: RunScopeCacheService, toolCategoryCache: ToolCategoryCacheService);
    onModuleInit(): void;
    fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]): Promise<import("../../../../runtime-cache/tool-category-cache.service").ToolCategoryCacheRow[]>;
    getSessionAllowedTools(sessionId: string, agentId: number, userId: number, appClientId: number): Promise<({
        integration: {
            id: number;
            updatedAt: Date;
            name: string;
            apiKey: string;
            baseUrl: string;
            authMode: import("../../../../../../generated/prisma/enums").IntegrationAuthMode;
        };
    } & {
        path: string;
        id: number;
        appClientId: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        method: import("../../../../../../generated/prisma/enums").HttpMethod;
        definitionKey: string;
        riskLevel: import("../../../../../../generated/prisma/enums").ToolLevel;
        schema: import("@prisma/client/runtime/client").JsonValue;
        inputSchema: import("@prisma/client/runtime/client").JsonValue;
        outputSchema: import("@prisma/client/runtime/client").JsonValue;
        responseProfile: import("@prisma/client/runtime/client").JsonValue;
        agentMetadata: import("@prisma/client/runtime/client").JsonValue;
        integrationId: number;
        toolCategoryId: number;
        timeout: number;
    })[]>;
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
}
