import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../modules/host-tool/host-tool.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import {
  buildPageActionBuiltinShowResultHostTool,
  PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME,
} from './page-action-builtin-host-tool.util';
import {
  resolvePageActionHostTool,
  type ResolvedPageActionHostTool,
} from './page-action-host-tool.util';

export type ResolvedPageActionSummarizeHostTool = {
  hostTool: ResolvedPageActionHostTool;
  builtin: boolean;
};

async function loadHostToolRow(
  prisma: PrismaService,
  appClientId: number,
  hostToolId: number,
) {
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
 * summarize DSL 锚点：节点 hostToolId → PageAction.hostToolId → 内置展示 tool。
 */
export async function resolvePageActionSummarizeHostTool(
  prisma: PrismaService,
  input: {
    appClientId: number;
    nodeHostToolId?: unknown;
    pageContext: AgentChatPageContext | null | undefined;
    fallbackHostTool?: ResolvedPageActionHostTool | null;
  },
): Promise<ResolvedPageActionSummarizeHostTool> {
  if (
    typeof input.nodeHostToolId === 'number' &&
    Number.isInteger(input.nodeHostToolId) &&
    input.nodeHostToolId > 0
  ) {
    const row = await loadHostToolRow(
      prisma,
      input.appClientId,
      input.nodeHostToolId,
    );
    if (!row.isActive) {
      throw new BadRequestException({
        code: 'HOST_TOOL_INACTIVE',
        message: `HostTool "${row.name}" is inactive`,
      });
    }
    return {
      hostTool: resolvePageActionHostTool(row, input.pageContext),
      builtin: false,
    };
  }
  if (input.fallbackHostTool) {
    return {
      hostTool: input.fallbackHostTool,
      builtin: false,
    };
  }
  return {
    hostTool: buildPageActionBuiltinShowResultHostTool(),
    builtin: true,
  };
}

export function isPageActionBuiltinShowResultTool(
  hostTool: ResolvedPageActionHostTool,
): boolean {
  return hostTool.definition.name === PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME;
}
