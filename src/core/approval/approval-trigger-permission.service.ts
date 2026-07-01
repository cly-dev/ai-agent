import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserRoleToolAccessContext } from '../../modules/agent/util/agent-client-access.util';
import {
  buildRoleAccessibleToolWhere,
} from '../../modules/agent/util/agent-client-access.util';
import { AgentToolCatalogService } from '../runtime-cache/agent-tool-catalog.service';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
import {
  evaluateWorkflowTriggerPermissionForNodes,
  isWorkflowTriggerPermissionEnabled,
} from '../workflow/workflow-trigger-permission.util';

export type WorkflowTriggerPermissionCheckResult =
  | { allowed: true; skipped: boolean }
  | { allowed: false; missingToolIds: number[]; skipped: false };

@Injectable()
export class ApprovalTriggerPermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentToolCatalog: AgentToolCatalogService,
  ) {}

  /** chat / agent 路径：经 Agent catalog ∩ RoleTool。 */
  async resolveUserAllowedToolIds(input: {
    userId: number;
    appClientId: number;
    agentId: number;
  }): Promise<number[]> {
    const tools = await this.agentToolCatalog.resolveAllowedTools(
      input.agentId,
      input.userId,
      input.appClientId,
    );
    return tools.map((tool) => tool.id);
  }

  /** pageAction 路径：无 agent，直接 RoleTool ∩ App active tools。 */
  async resolveUserAllowedToolIdsForApp(input: {
    userId: number;
    appClientId: number;
  }): Promise<number[]> {
    const roleCtx = await this.resolveRoleToolContext(input);
    if (!roleCtx) {
      return [];
    }
    const tools = await this.prisma.tool.findMany({
      where: buildRoleAccessibleToolWhere(input.appClientId, roleCtx, {
        isActive: true,
      }),
      select: { id: true },
    });
    return tools.map((tool) => tool.id);
  }

  async resolveRoleToolContext(input: {
    userId: number;
    appClientId: number;
  }): Promise<UserRoleToolAccessContext | null> {
    const userApp = await this.prisma.userApp.findUnique({
      where: {
        userId_appId: { userId: input.userId, appId: input.appClientId },
      },
      include: {
        role: {
          include: { roleTools: { select: { toolId: true } } },
        },
      },
    });
    if (!userApp?.role) {
      return null;
    }
    return {
      roleId: userApp.role.id,
      maxLevel: userApp.role.allowToolLevel,
      roleToolIds: userApp.role.roleTools.map((row) => row.toolId),
    };
  }

  evaluateForNodes(input: {
    nodes: WorkflowNodeDef[];
    allowedToolIds: Iterable<number>;
    enabled?: boolean;
  }): WorkflowTriggerPermissionCheckResult {
    const decision = evaluateWorkflowTriggerPermissionForNodes({
      nodes: input.nodes,
      allowedToolIds: input.allowedToolIds,
      enabled: input.enabled ?? isWorkflowTriggerPermissionEnabled(),
    });
    if (decision.allowed) {
      return { allowed: true, skipped: decision.skipped };
    }
    return {
      allowed: false,
      missingToolIds: decision.missingToolIds,
      skipped: false,
    };
  }
}
