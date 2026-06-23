import { Injectable } from '@nestjs/common';
import type { HostToolDecisionDefinition } from '../host-bridge';
import type { CachedScopedToolsEntry } from '../agent-engine/engine/main/types/agent-engine.types';
import type { ScopedToolsResult } from '../agent-engine/engine/main/types/agent-engine.types';
import {
  MAX_RUN_SCOPE_CACHE_ENTRIES,
  getRunScopeCacheTtlMs,
} from './runtime-cache.constants';

type HostToolRunCacheEntry = {
  tools: HostToolDecisionDefinition[];
  expiresAt: number;
};

type IntentScopedCacheEntry = CachedScopedToolsEntry;

@Injectable()
export class RunScopeCacheService {
  private readonly hostToolsByRun = new Map<string, HostToolRunCacheEntry>();
  private readonly intentScopedBySession = new Map<
    string,
    IntentScopedCacheEntry
  >();

  getHostToolsForRun(
    runId: number,
    pageScope: string,
    skillId: number | null | undefined,
  ): HostToolDecisionDefinition[] | null {
    const key = this.hostToolKey(runId, pageScope, skillId);
    const entry = this.hostToolsByRun.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) {
        this.hostToolsByRun.delete(key);
      }
      return null;
    }
    return entry.tools;
  }

  setHostToolsForRun(
    runId: number,
    pageScope: string,
    skillId: number | null | undefined,
    tools: HostToolDecisionDefinition[],
  ): void {
    const key = this.hostToolKey(runId, pageScope, skillId);
    this.hostToolsByRun.set(key, {
      tools,
      expiresAt: Date.now() + getRunScopeCacheTtlMs(),
    });
    this.pruneHostTools();
  }

  clearHostToolsForRun(runId: number): void {
    const prefix = `${runId}:`;
    for (const key of this.hostToolsByRun.keys()) {
      if (key.startsWith(prefix)) {
        this.hostToolsByRun.delete(key);
      }
    }
  }

  getIntentScoped(
    cacheKey: string,
    toolFingerprint: string,
  ): IntentScopedCacheEntry | null {
    const entry = this.intentScopedBySession.get(cacheKey);
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) {
        this.intentScopedBySession.delete(cacheKey);
      }
      return null;
    }
    if (entry.toolFingerprint !== toolFingerprint) {
      this.intentScopedBySession.delete(cacheKey);
      return null;
    }
    return entry;
  }

  setIntentScoped(
    cacheKey: string,
    toolFingerprint: string,
    value: ScopedToolsResult,
  ): void {
    this.intentScopedBySession.set(cacheKey, {
      ...value,
      toolFingerprint,
      expiresAt: Date.now() + getRunScopeCacheTtlMs(),
    });
    this.pruneIntent();
  }

  clearForSession(sessionId: string): void {
    const marker = `${sessionId}:`;
    for (const key of this.intentScopedBySession.keys()) {
      if (key.startsWith(marker)) {
        this.intentScopedBySession.delete(key);
      }
    }
  }

  clearIntentReferencingToolIds(toolIds: number[]): void {
    if (toolIds.length === 0) {
      return;
    }
    const idSet = new Set(toolIds);
    for (const [key, entry] of this.intentScopedBySession) {
      if (entry.scopedTools.some((tool) => idSet.has(tool.id))) {
        this.intentScopedBySession.delete(key);
      }
    }
  }

  clearAllIntent(): void {
    this.intentScopedBySession.clear();
  }

  private hostToolKey(
    runId: number,
    pageScope: string,
    skillId: number | null | undefined,
  ): string {
    return `${runId}:${pageScope.trim()}:${skillId ?? 'none'}`;
  }

  private pruneHostTools(): void {
    const now = Date.now();
    for (const [key, entry] of this.hostToolsByRun) {
      if (entry.expiresAt <= now) {
        this.hostToolsByRun.delete(key);
      }
    }
    while (this.hostToolsByRun.size > MAX_RUN_SCOPE_CACHE_ENTRIES) {
      const first = this.hostToolsByRun.keys().next().value;
      if (first === undefined) {
        break;
      }
      this.hostToolsByRun.delete(first);
    }
  }

  private pruneIntent(): void {
    const now = Date.now();
    for (const [key, entry] of this.intentScopedBySession) {
      if (entry.expiresAt <= now) {
        this.intentScopedBySession.delete(key);
      }
    }
    while (this.intentScopedBySession.size > MAX_RUN_SCOPE_CACHE_ENTRIES) {
      const first = this.intentScopedBySession.keys().next().value;
      if (first === undefined) {
        break;
      }
      this.intentScopedBySession.delete(first);
    }
  }
}
