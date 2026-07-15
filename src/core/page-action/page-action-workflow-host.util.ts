import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../modules/host-tool/host-tool.types';
import type { HostToolDetailRow } from '../../modules/host-tool/host-tool.types';
import type { PageActionDetailRow } from '../../modules/page-action/page-action.types';
import {
  resolvePageActionHostTool,
  type ResolvedPageActionHostTool,
} from './page-action-host-tool.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';

import { resolveGenerateAndPushHostToolIds } from '../workflow/resolve-workflow-node-tool-refs.util';

async function loadHostToolRow(
  prisma: PrismaService,
  appClientId: number,
  hostToolId: number,
): Promise<HostToolDetailRow> {
  const hostTool = await prisma.hostTool.findFirst({
    where: { id: hostToolId, appClientId },
    include: HOST_TOOL_DETAIL_INCLUDE,
  });
  if (!hostTool) {
    throw new NotFoundException({
      code: 'HOST_TOOL_NOT_FOUND',
      message: `HostTool ${hostToolId} not found for AppClient ${appClientId}`,
    });
  }
  return hostTool;
}

/**
 * PageAction 上的 hostToolId 始终可选。
 * 有值时作为 Legacy 填入或 Workflow push 节点兜底；分析类可不绑。
 */
export async function resolvePageActionHostToolRow(
  prisma: PrismaService,
  pageAction: PageActionDetailRow,
): Promise<HostToolDetailRow | null> {
  if (pageAction.hostTool) {
    return pageAction.hostTool;
  }
  return null;
}

export async function resolvePageActionHostToolResolved(
  prisma: PrismaService,
  pageAction: PageActionDetailRow,
  pageContext: AgentChatPageContext | null | undefined,
): Promise<ResolvedPageActionHostTool | null> {
  const row = await resolvePageActionHostToolRow(prisma, pageAction);
  if (!row) {
    return null;
  }
  if (!row.isActive) {
    throw new BadRequestException({
      code: 'HOST_TOOL_INACTIVE',
      message: `Bound HostTool "${row.name}" is inactive`,
    });
  }
  return resolvePageActionHostTool(row, pageContext);
}

/** generate_and_push：解析节点 hostToolIds[]（含旧 hostToolId）为候选列表。 */
export async function resolvePageActionHostToolsForPushNode(
  prisma: PrismaService,
  input: {
    appClientId: number;
    nodeInput: unknown;
    pageContext: AgentChatPageContext | null | undefined;
    fallbackHostTool?: ResolvedPageActionHostTool | null;
  },
): Promise<ResolvedPageActionHostTool[]> {
  const hostToolIds = resolveGenerateAndPushHostToolIds(input.nodeInput);
  if (hostToolIds.length === 0) {
    if (input.fallbackHostTool) {
      return [input.fallbackHostTool];
    }
    throw new BadRequestException({
      code: 'PAGE_ACTION_PUSH_HOST_TOOL_MISSING',
      message:
        'generate_and_push node requires input.hostToolIds/hostToolId or PageAction.hostToolId',
    });
  }
  const resolved: ResolvedPageActionHostTool[] = [];
  for (const hostToolId of hostToolIds) {
    const row = await loadHostToolRow(
      prisma,
      input.appClientId,
      hostToolId,
    );
    if (!row.isActive) {
      throw new BadRequestException({
        code: 'HOST_TOOL_INACTIVE',
        message: `HostTool "${row.name}" is inactive`,
      });
    }
    resolved.push(resolvePageActionHostTool(row, input.pageContext));
  }
  return resolved;
}

/** @deprecated Prefer resolvePageActionHostToolsForPushNode */
export async function resolvePageActionHostToolForPushNode(
  prisma: PrismaService,
  input: {
    appClientId: number;
    hostToolId: unknown;
    pageContext: AgentChatPageContext | null | undefined;
    fallbackHostTool?: ResolvedPageActionHostTool | null;
  },
): Promise<ResolvedPageActionHostTool> {
  const list = await resolvePageActionHostToolsForPushNode(prisma, {
    appClientId: input.appClientId,
    nodeInput: { hostToolId: input.hostToolId },
    pageContext: input.pageContext,
    fallbackHostTool: input.fallbackHostTool,
  });
  return list[0]!;
}
