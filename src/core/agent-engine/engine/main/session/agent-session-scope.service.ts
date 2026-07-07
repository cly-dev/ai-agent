import { Injectable, OnModuleInit } from '@nestjs/common';
import { SessionRuntimeResolverService } from '../../../../../modules/chat/session-runtime-resolver.service';
import { IntentScopeService } from '../../../../intent/intent-scope.service';
import {
  ToolEngineService,
  type ToolBuildContext,
} from '../../../../tool-engine/tool-engine.service';
import { buildEntityRevisionsFingerprint } from '../../../../runtime-cache/runtime-revision.util';
import { logRuntimeCacheEvent } from '../../../../runtime-cache/runtime-cache-observability.util';
import { RuntimeCacheInvalidator } from '../../../../runtime-cache/runtime-cache-invalidator.service';
import { RunScopeCacheService } from '../../../../runtime-cache/run-scope-cache.service';
import { ToolCategoryCacheService } from '../../../../runtime-cache/tool-category-cache.service';
import type {
  AgentEngineTool,
  ParsedIntentPayload,
  ScopedToolsResult,
} from '../types/agent-engine.types';

@Injectable()
export class AgentSessionScopeService implements OnModuleInit {
  constructor(
    private readonly sessionRuntimeResolver: SessionRuntimeResolverService,
    private readonly intentScopeService: IntentScopeService,
    private readonly toolEngine: ToolEngineService,
    private readonly invalidator: RuntimeCacheInvalidator,
    private readonly runScopeCache: RunScopeCacheService,
    private readonly toolCategoryCache: ToolCategoryCacheService,
  ) {}

  onModuleInit(): void {
    this.invalidator.registerSessionScopeHooks({
      invalidateCachesForAgent: (agentId, sessionIds) =>
        this.invalidateCachesForAgent(agentId, sessionIds),
      invalidateCachesReferencingToolIds: (toolIds) =>
        this.invalidateCachesReferencingToolIds(toolIds),
      invalidateCachesForSession: (sessionId) =>
        this.invalidateCachesForSession(sessionId),
    });
  }

  async fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]) {
    return this.toolCategoryCache.fetchByIds(toolCategoryIds);
  }

  async getSessionAllowedTools(
    sessionId: string,
    agentId: number,
    userId: number,
    appClientId: number,
  ) {
    const bundle = await this.sessionRuntimeResolver.resolveAllowedToolsBundle({
      sessionId,
      agentId,
      userId,
      appClientId,
    });
    return bundle.tools;
  }

  invalidateCachesForAgent(_agentId: number, sessionIds: string[]): void {
    if (sessionIds.length > 0) {
      for (const sessionId of sessionIds) {
        this.invalidateCachesForSession(sessionId);
      }
      return;
    }
    this.runScopeCache.clearAllIntent();
  }

  invalidateCachesReferencingToolIds(toolIds: number[]): void {
    this.runScopeCache.clearIntentReferencingToolIds(toolIds);
  }

  invalidateCachesForSession(sessionId: string): void {
    this.sessionRuntimeResolver.invalidateSession(sessionId);
    this.runScopeCache.clearForSession(sessionId);
  }

  buildToolsRuntimeRevision(tools: AgentEngineTool[]): string {
    return buildEntityRevisionsFingerprint(
      tools.map((tool) => ({
        id: tool.id,
        updatedAt:
          'updatedAt' in tool && tool.updatedAt != null
            ? String(tool.updatedAt)
            : undefined,
      })),
    );
  }

  buildIntentScopeCacheKey(
    sessionId: string,
    matchedCategoryIds: number[],
    userMessage: string,
  ): string {
    const cats = [...matchedCategoryIds].sort((a, b) => a - b).join(',');
    const msg = userMessage.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${sessionId}:intent:${cats || 'none'}:${msg}`;
  }

  async resolveScopedToolsForIntent(input: {
    sessionId: string;
    userMessage: string;
    tools: AgentEngineTool[];
    toolBuildCtx: ToolBuildContext;
    matchedCategoryIds: number[];
  }): Promise<ScopedToolsResult & { fromCache: boolean }> {
    const toolRevision = this.buildToolsRuntimeRevision(input.tools);
    const cacheKey = this.buildIntentScopeCacheKey(
      input.sessionId,
      input.matchedCategoryIds,
      input.userMessage,
    );
    const cached = this.runScopeCache.getIntentScoped(cacheKey, toolRevision);
    if (cached) {
      logRuntimeCacheEvent({
        layer: 'L0',
        operation: 'resolveScopedToolsForIntent',
        cacheHit: true,
        sessionId: input.sessionId,
      });
      return {
        scopedTools: cached.scopedTools,
        scopedLangChainTools: cached.scopedLangChainTools,
        scopedToolBundle: cached.scopedToolBundle,
        scopedAllowedToolIds: cached.scopedAllowedToolIds,
        bindCap: cached.bindCap,
        fallbackReason: cached.fallbackReason,
        fromCache: true,
      };
    }

    const scoped = await this.scopeToolsForMainLoop(
      input.tools,
      input.userMessage,
      input.toolBuildCtx,
      input.matchedCategoryIds,
    );
    this.runScopeCache.setIntentScoped(cacheKey, toolRevision, scoped);
    logRuntimeCacheEvent({
      layer: 'L0',
      operation: 'resolveScopedToolsForIntent',
      cacheHit: false,
      sessionId: input.sessionId,
    });
    return { ...scoped, fromCache: false };
  }

  filterToolsByIntent(
    tools: AgentEngineTool[],
    parsed: ParsedIntentPayload,
  ): AgentEngineTool[] {
    if (!parsed.intentClear) {
      return tools;
    }
    const idSet = new Set(parsed.matchedCategoryIds);
    if (idSet.size === 0 && !parsed.includeUncategorized) {
      return tools;
    }
    const narrowed = tools.filter((t) => {
      if (t.toolCategoryId != null && idSet.has(t.toolCategoryId)) {
        return true;
      }
      if (t.toolCategoryId == null && parsed.includeUncategorized) {
        return true;
      }
      return false;
    });
    return narrowed.length > 0 ? narrowed : tools;
  }

  async scopeToolsForMainLoop(
    tools: AgentEngineTool[],
    userMessage: string,
    toolBuildCtx: ToolBuildContext,
    preferredCategoryIds?: number[],
  ): Promise<ScopedToolsResult> {
    const result = await this.intentScopeService.scopeToolsForMainLoop(
      tools,
      userMessage,
      toolBuildCtx,
      preferredCategoryIds,
      true,
    );
    const scopedToolBundle =
      result.scopedToolBundle ??
      this.toolEngine.buildLangChainTools(tools, {
        ...toolBuildCtx,
        allowedToolIds: tools.map((tool) => tool.id),
      });
    return {
      scopedTools: result.scopedTools as AgentEngineTool[],
      scopedLangChainTools: result.scopedLangChainTools,
      scopedToolBundle,
      scopedAllowedToolIds: result.scopedAllowedToolIds,
      bindCap: result.bindCap,
      fallbackReason: result.fallbackReason,
    };
  }
}
