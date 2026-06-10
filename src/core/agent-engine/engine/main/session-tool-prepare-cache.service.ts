import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SessionPrepareStore } from '../../../../modules/chat/session-prepare.store';
import { AgentSessionScopeService } from './agent-session-scope.service';

/** 统一失效会话 tool 预热缓存（Redis + 进程内）。 */
@Injectable()
export class SessionToolPrepareCacheService {
  private readonly logger = new Logger(SessionToolPrepareCacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly sessionScope: AgentSessionScopeService,
  ) {}

  async invalidateForAgent(agentId: number): Promise<void> {
    this.sessionScope.invalidateCachesForAgent(agentId);
    const removed =
      await this.sessionPrepareStore.invalidateSnapshotsForAgent(agentId);
    if (removed > 0) {
      this.logger.log(
        `invalidated ${removed} session prepare cache(s) for agentId=${agentId}`,
      );
    }
  }

  /**
   * tool 启用/禁用/删除后失效相关预热。
   * 除按 toolId 清理外，还会清理绑定该 tool 的所有 Agent 会话缓存（覆盖「新启用」场景）。
   */
  async invalidateForTools(toolIds: number[]): Promise<void> {
    if (toolIds.length === 0) {
      return;
    }
    this.sessionScope.invalidateCachesReferencingToolIds(toolIds);
    await this.sessionPrepareStore.invalidateSnapshotsContainingToolIds(toolIds);

    const agentRows = await this.prisma.agentTool.findMany({
      where: { toolId: { in: toolIds } },
      select: { agentId: true },
      distinct: ['agentId'],
    });
    await Promise.all(
      agentRows.map((row) => this.invalidateForAgent(row.agentId)),
    );
  }
}
