import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentHostToolCatalogStore } from './agent-host-tool-catalog.store';
import { AgentToolCatalogStore } from './agent-tool-catalog.store';
import { AgentSkillCatalogStore } from './agent-skill-catalog.store';
import { RunScopeCacheService } from './run-scope-cache.service';
import { ToolCategoryCacheService } from './tool-category-cache.service';

/** L1/L2/L0 运行时缓存统一失效入口。 */
@Injectable()
export class RuntimeCacheInvalidator {
  private readonly logger = new Logger(RuntimeCacheInvalidator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hostToolCatalogStore: AgentHostToolCatalogStore,
    private readonly agentToolCatalogStore: AgentToolCatalogStore,
    private readonly agentSkillCatalogStore: AgentSkillCatalogStore,
    private readonly runScopeCache: RunScopeCacheService,
    private readonly toolCategoryCache: ToolCategoryCacheService,
  ) {}

  /**
   * 由 ChatModule 在启动时注入 SessionPrepareStore 的失效能力，
   * 避免 runtime-cache ↔ chat 循环依赖。
   */
  private sessionRuntimeHooks: {
    invalidateSnapshotsForAgent: (agentId: number) => Promise<string[]>;
    invalidateSnapshotsContainingToolIds: (toolIds: number[]) => Promise<number>;
    deleteSession: (sessionId: string) => Promise<void>;
  } | null = null;

  private sessionScopeHooks: {
    invalidateCachesForAgent: (
      agentId: number,
      sessionIds: string[],
    ) => void;
    invalidateCachesReferencingToolIds: (toolIds: number[]) => void;
    invalidateCachesForSession: (sessionId: string) => void;
  } | null = null;

  registerSessionRuntimeHooks(hooks: {
    invalidateSnapshotsForAgent: (agentId: number) => Promise<string[]>;
    invalidateSnapshotsContainingToolIds: (toolIds: number[]) => Promise<number>;
    deleteSession: (sessionId: string) => Promise<void>;
  }): void {
    this.sessionRuntimeHooks = hooks;
  }

  registerSessionScopeHooks(hooks: {
    invalidateCachesForAgent: (
      agentId: number,
      sessionIds: string[],
    ) => void;
    invalidateCachesReferencingToolIds: (toolIds: number[]) => void;
    invalidateCachesForSession: (sessionId: string) => void;
  }): void {
    this.sessionScopeHooks = hooks;
  }

  async invalidateForAgent(input: {
    agentId: number;
    appClientId?: number;
  }): Promise<void> {
    const sessionIds =
      (await this.sessionRuntimeHooks?.invalidateSnapshotsForAgent(
        input.agentId,
      )) ?? [];
    this.sessionScopeHooks?.invalidateCachesForAgent(
      input.agentId,
      sessionIds,
    );
    if (sessionIds.length > 0) {
      this.logger.log(
        `invalidated ${sessionIds.length} session runtime snapshot(s) for agentId=${input.agentId}`,
      );
    }
    if (input.appClientId != null) {
      await this.deleteAgentL2Catalogs(input.appClientId, input.agentId);
    } else {
      const agent = await this.prisma.agent.findUnique({
        where: { id: input.agentId },
        select: { appClientId: true },
      });
      if (agent) {
        await this.deleteAgentL2Catalogs(agent.appClientId, input.agentId);
      }
    }
  }

  private async deleteAgentL2Catalogs(
    appClientId: number,
    agentId: number,
  ): Promise<void> {
    await Promise.all([
      this.hostToolCatalogStore.delete(appClientId, agentId),
      this.agentToolCatalogStore.delete(appClientId, agentId),
      this.agentSkillCatalogStore.deleteForAgent(appClientId, agentId),
    ]);
  }

  async invalidateForAppClient(appClientId: number): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { appClientId },
      select: { id: true },
    });
    await Promise.all(
      agents.map((agent) =>
        this.invalidateForAgent({ agentId: agent.id, appClientId }),
      ),
    );
  }

  async invalidateForTools(toolIds: number[]): Promise<void> {
    if (toolIds.length === 0) {
      return;
    }
    this.sessionScopeHooks?.invalidateCachesReferencingToolIds(toolIds);
    await this.sessionRuntimeHooks?.invalidateSnapshotsContainingToolIds(
      toolIds,
    );

    const appRows = await this.prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: { appClientId: true },
      distinct: ['appClientId'],
    });
    await Promise.all(
      appRows.map((row) => this.invalidateForAppClient(row.appClientId)),
    );
  }

  async invalidateForHostTools(hostToolIds: number[]): Promise<void> {
    if (hostToolIds.length === 0) {
      return;
    }
    const appRows = await this.prisma.hostTool.findMany({
      where: { id: { in: hostToolIds } },
      select: { appClientId: true },
      distinct: ['appClientId'],
    });
    await Promise.all(
      appRows.map((row) => this.invalidateForAppClient(row.appClientId)),
    );
  }

  async invalidateForSkillAgent(agentId: number, appClientId: number): Promise<void> {
    await this.invalidateForAppClient(appClientId);
  }

  async invalidateForIntegration(integrationId: number): Promise<void> {
    const tools = await this.prisma.tool.findMany({
      where: { integrationId },
      select: { id: true },
    });
    await this.invalidateForTools(tools.map((row) => row.id));
  }

  invalidateForSession(sessionId: string): void {
    this.sessionScopeHooks?.invalidateCachesForSession(sessionId);
    void this.sessionRuntimeHooks?.deleteSession(sessionId);
    this.runScopeCache.clearForSession(sessionId);
  }

  clearRunScope(runId: number): void {
    this.runScopeCache.clearHostToolsForRun(runId);
  }

  invalidateToolCategories(): void {
    this.toolCategoryCache.clearAll();
  }
}
