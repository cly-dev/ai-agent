import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import { SkillService } from '../../core/skill/skill.service';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { AgentToolCatalogService } from '../../core/runtime-cache/agent-tool-catalog.service';
import {
  buildSkillsRuntimeRevision,
} from '../../core/runtime-cache/runtime-revision.util';
import type { RuntimeRevision } from '../../core/runtime-cache/runtime-cache.types';
import { logRuntimeCacheEvent } from '../../core/runtime-cache/runtime-cache-observability.util';
import {
  areSessionRuntimeRevisionsEqual,
  buildSessionRuntimeRevision,
} from './session-prepare.util';
import { SessionPrepareStore } from './session-prepare.store';
import type {
  SessionAllowedToolsRow,
  SessionPrepareSkillRow,
} from './session-prepare.types';

const IN_PROCESS_BUNDLE_TTL_MS = 60_000;

export type SessionAllowedToolsBundle = {
  tools: SessionAllowedToolsRow[];
  skillRows: SessionPrepareSkillRow[];
  revision: RuntimeRevision;
  fromCache: boolean;
};

type InProcessBundleEntry = {
  bundle: SessionAllowedToolsBundle;
  expiresAt: number;
};

@Injectable()
export class SessionRuntimeResolverService {
  private readonly inProcessBundles = new Map<string, InProcessBundleEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
    private readonly skillService: SkillService,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly hostToolCatalogService: AgentHostToolCatalogService,
    private readonly agentToolCatalogService: AgentToolCatalogService,
  ) {}

  invalidateSession(sessionId: string): void {
    for (const key of this.inProcessBundles.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.inProcessBundles.delete(key);
      }
    }
  }

  async resolveAllowedToolsBundle(input: {
    sessionId: string;
    agentId: number;
    userId: number;
    appClientId: number;
  }): Promise<SessionAllowedToolsBundle> {
    const memKey = this.inProcessKey(input);
    const memHit = this.inProcessBundles.get(memKey);
    if (memHit && memHit.expiresAt > Date.now()) {
      logRuntimeCacheEvent({
        layer: 'L0',
        operation: 'resolveAllowedToolsBundle',
        cacheHit: true,
        sessionId: input.sessionId,
        agentId: input.agentId,
        appClientId: input.appClientId,
        extra: { source: 'in_process' },
      });
      return { ...memHit.bundle, fromCache: true };
    }

    const cached = await this.sessionPrepareStore.get(
      input.sessionId,
      input.userId,
      input.appClientId,
      input.agentId,
    );
    if (cached) {
      const freshRevision = await this.fetchLightweightRevision(
        input.appClientId,
        input.agentId,
        cached.skills.map((row) => row.id),
      );
      if (areSessionRuntimeRevisionsEqual(cached.revision, freshRevision)) {
        const bundle: SessionAllowedToolsBundle = {
          tools: cached.tools,
          skillRows: cached.skills,
          revision: cached.revision,
          fromCache: true,
        };
        this.rememberInProcess(memKey, bundle);
        logRuntimeCacheEvent({
          layer: 'L1',
          operation: 'resolveAllowedToolsBundle',
          cacheHit: true,
          sessionId: input.sessionId,
          agentId: input.agentId,
          appClientId: input.appClientId,
        });
        return bundle;
      }
      await this.sessionPrepareStore.delete(input.sessionId);
      logRuntimeCacheEvent({
        layer: 'L1',
        operation: 'resolveAllowedToolsBundle',
        cacheHit: false,
        revisionMismatch: true,
        sessionId: input.sessionId,
        agentId: input.agentId,
        appClientId: input.appClientId,
      });
    } else {
      logRuntimeCacheEvent({
        layer: 'L1',
        operation: 'resolveAllowedToolsBundle',
        cacheHit: false,
        sessionId: input.sessionId,
        agentId: input.agentId,
        appClientId: input.appClientId,
      });
    }

    const bundle = await this.loadFreshBundle(input);
    this.rememberInProcess(memKey, bundle);
    await this.sessionPrepareStore.trySet({
      sessionId: input.sessionId,
      userId: input.userId,
      appClientId: input.appClientId,
      agentId: input.agentId,
      revision: bundle.revision,
      tools: bundle.tools,
      skills: bundle.skillRows,
    });
    return bundle;
  }

  private async loadFreshBundle(input: {
    sessionId: string;
    agentId: number;
    userId: number;
    appClientId: number;
  }): Promise<SessionAllowedToolsBundle> {
    const freshTools = await this.agentService.getAllowedTools(
      input.agentId,
      input.userId,
      input.appClientId,
    );
    const freshSkills =
      await this.skillService.listRunnableAgentSkillsForUser(
        {
          agentId: input.agentId,
          userId: input.userId,
          appClientId: input.appClientId,
        },
        new Set(freshTools.map((tool) => tool.id)),
      );
    const skillRows = await this.loadSkillRevisionRows(
      freshSkills.map((skill) => skill.id),
    );
    const hostToolsRevision =
      await this.hostToolCatalogService.fetchRevisionFromDb(
        input.appClientId,
        input.agentId,
      );
    const revision = buildSessionRuntimeRevision({
      tools: freshTools,
      skills: skillRows,
      hostToolsRevision,
    });
    return {
      tools: freshTools,
      skillRows,
      revision,
      fromCache: false,
    };
  }

  private async fetchLightweightRevision(
    appClientId: number,
    agentId: number,
    cachedSkillIds: number[],
  ): Promise<RuntimeRevision> {
    const [hostToolsRevision, toolParts, skillRows] = await Promise.all([
      this.hostToolCatalogService.fetchRevisionFromDb(appClientId, agentId),
      this.agentToolCatalogService.fetchRuntimeRevisionParts(appClientId, agentId),
      this.loadSkillRevisionRows(cachedSkillIds),
    ]);
    return {
      tools: toolParts.tools,
      integrations: toolParts.integrations,
      skills: buildSkillsRuntimeRevision(skillRows),
      hostTools: hostToolsRevision,
    };
  }

  private async loadSkillRevisionRows(skillIds: number[]) {
    if (skillIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  private inProcessKey(input: {
    sessionId: string;
    agentId: number;
    userId: number;
    appClientId: number;
  }): string {
    return `${input.sessionId}:${input.agentId}:${input.userId}:${input.appClientId}`;
  }

  private rememberInProcess(
    memKey: string,
    bundle: SessionAllowedToolsBundle,
  ): void {
    this.inProcessBundles.set(memKey, {
      bundle,
      expiresAt: Date.now() + IN_PROCESS_BUNDLE_TTL_MS,
    });
  }
}
