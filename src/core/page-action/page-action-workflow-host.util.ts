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

/** generate_and_push 执行期：从节点 input.hostToolId 加载 HostTool。 */
export async function resolvePageActionHostToolForPushNode(
  prisma: PrismaService,
  input: {
    appClientId: number;
    hostToolId: unknown;
    pageContext: AgentChatPageContext | null | undefined;
    fallbackHostTool?: ResolvedPageActionHostTool | null;
  },
): Promise<ResolvedPageActionHostTool> {
  if (
    typeof input.hostToolId === 'number' &&
    Number.isInteger(input.hostToolId) &&
    input.hostToolId > 0
  ) {
    const row = await loadHostToolRow(
      prisma,
      input.appClientId,
      input.hostToolId,
    );
    if (!row.isActive) {
      throw new BadRequestException({
        code: 'HOST_TOOL_INACTIVE',
        message: `HostTool "${row.name}" is inactive`,
      });
    }
    return resolvePageActionHostTool(row, input.pageContext);
  }
  if (input.fallbackHostTool) {
    return input.fallbackHostTool;
  }
  throw new BadRequestException({
    code: 'PAGE_ACTION_PUSH_HOST_TOOL_MISSING',
    message:
      'generate_and_push node requires input.hostToolId or PageAction.hostToolId',
  });
}
