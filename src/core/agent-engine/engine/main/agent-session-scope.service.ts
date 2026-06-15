import { Injectable } from '@nestjs/common';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SessionPrepareStore } from '../../../../modules/chat/session-prepare.store';
import { AgentService } from '../../../../modules/agent/agent.service';
import { IntentScopeService } from '../../../intent/intent-scope.service';
import { SkillService } from '../../../skill/skill.service';
import {
  ToolEngineService,
  type BuiltLangChainTools,
  type ToolBuildContext,
} from '../../../tool-engine/tool-engine.service';
import type {
  AgentEngineTool,
  CachedScopedToolsEntry,
  ParsedIntentPayload,
  ScopedToolsResult,
} from './agent-engine.types';
import { areToolIdSetsEqual } from '../../../../modules/chat/session-prepare.util';
import {
  MAX_SESSION_TOOL_CACHE_ENTRIES,
  SESSION_TOOL_CACHE_TTL_MS,
} from './agent-engine.types';

@Injectable()
export class AgentSessionScopeService {
  private readonly sessionAllowedToolsCache = new Map<
    string,
    { tools: Awaited<ReturnType<AgentService['getAllowedTools']>>; expiresAt: number }
  >();
  private readonly sessionIntentScopedToolsCache = new Map<
    string,
    CachedScopedToolsEntry
  >();
  private readonly toolCategoryRowsCache = new Map<
    string,
    {
      rows: Array<{ id: number; label: string; description: string | null }>;
      expiresAt: number;
    }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly skillService: SkillService,
    private readonly intentScopeService: IntentScopeService,
    private readonly toolEngine: ToolEngineService,
  ) {}

  async fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]) {
    const uniq = Array.from(new Set(toolCategoryIds)).sort((a, b) => a - b);
    if (uniq.length === 0) {
      return [];
    }
    const cacheKey = uniq.join(',');
    const cached = this.toolCategoryRowsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rows;
    }
    const rows = await this.prisma.toolCategory.findMany({
      where: { id: { in: uniq } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, description: true },
    });
    this.toolCategoryRowsCache.set(cacheKey, {
      rows,
      expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
    });
    this.pruneTimedCacheMap(this.toolCategoryRowsCache);
    return rows;
  }

  async getSessionAllowedTools(
    sessionId: string,
    agentId: number,
    userId: number,
    appClientId: number,
  ): Promise<Awaited<ReturnType<AgentService['getAllowedTools']>>> {
    const cacheKey = `${sessionId}:${agentId}:${userId}`;
    const freshTools = await this.agentService.getAllowedTools(
      agentId,
      userId,
      appClientId,
    );

    const cached = this.sessionAllowedToolsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      if (areToolIdSetsEqual(cached.tools, freshTools)) {
        return cached.tools;
      }
      this.sessionAllowedToolsCache.delete(cacheKey);
    }

    const fromRedis = await this.sessionPrepareStore.get(
      sessionId,
      userId,
      appClientId,
      agentId,
    );
    if (fromRedis && areToolIdSetsEqual(fromRedis.tools, freshTools)) {
      this.sessionAllowedToolsCache.set(cacheKey, {
        tools: fromRedis.tools,
        expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
      });
      return fromRedis.tools;
    }
    if (fromRedis) {
      await this.sessionPrepareStore.delete(sessionId);
    }

    const freshSkills = await this.skillService.listAgentSkillsForUser({
      agentId,
      userId,
      appClientId,
    });
    const skillRows = freshSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));

    this.sessionAllowedToolsCache.set(cacheKey, {
      tools: freshTools,
      expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
    });
    this.pruneTimedCacheMap(this.sessionAllowedToolsCache);
    void this.sessionPrepareStore.trySet(
      sessionId,
      userId,
      appClientId,
      agentId,
      freshTools,
      skillRows,
    );
    return freshTools;
  }

  /** Drop in-process allowed-tool caches for one agent (all sessions/users). */
  invalidateCachesForAgent(agentId: number): void {
    const marker = `:${agentId}:`;
    for (const key of this.sessionAllowedToolsCache.keys()) {
      if (key.includes(marker)) {
        this.sessionAllowedToolsCache.delete(key);
      }
    }
  }

  /** Drop in-process session tool caches that still reference given tool ids. */
  invalidateCachesReferencingToolIds(toolIds: number[]): void {
    if (toolIds.length === 0) {
      return;
    }
    const idSet = new Set(toolIds);
    for (const [key, entry] of this.sessionAllowedToolsCache) {
      if (entry.tools.some((tool) => idSet.has(tool.id))) {
        this.sessionAllowedToolsCache.delete(key);
      }
    }
    for (const [key, entry] of this.sessionIntentScopedToolsCache) {
      if (entry.scopedTools.some((tool) => idSet.has(tool.id))) {
        this.sessionIntentScopedToolsCache.delete(key);
      }
    }
  }

  buildToolIdsFingerprint(tools: AgentEngineTool[]): string {
    return tools
      .map((tool) => tool.id)
      .sort((a, b) => a - b)
      .join(',');
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
    const toolFingerprint = this.buildToolIdsFingerprint(input.tools);
    const cacheKey = this.buildIntentScopeCacheKey(
      input.sessionId,
      input.matchedCategoryIds,
      input.userMessage,
    );
    const cached = this.sessionIntentScopedToolsCache.get(cacheKey);
    if (
      cached &&
      cached.expiresAt > Date.now() &&
      cached.toolFingerprint === toolFingerprint
    ) {
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
    this.sessionIntentScopedToolsCache.set(cacheKey, {
      ...scoped,
      toolFingerprint,
      expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
    });
    this.pruneTimedCacheMap(this.sessionIntentScopedToolsCache);
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

  private pruneTimedCacheMap<K, V extends { expiresAt: number }>(
    map: Map<K, V>,
  ): void {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (entry.expiresAt <= now) {
        map.delete(key);
      }
    }
    while (map.size > MAX_SESSION_TOOL_CACHE_ENTRIES) {
      const first = map.keys().next().value;
      if (first === undefined) {
        break;
      }
      map.delete(first);
    }
  }
}
