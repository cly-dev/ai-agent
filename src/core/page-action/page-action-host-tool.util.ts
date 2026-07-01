import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  canDispatchHostAction,
  type HostToolDecisionDefinition,
} from '../host-bridge';
import { resolveStreamablePathFromHostTool } from '../host-bridge/host-tool-stream-target.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { HostToolDetailRow } from '../../modules/host-tool/host-tool.types';

export type ResolvedPageActionHostTool = {
  definition: HostToolDecisionDefinition;
  streamablePath: string | null;
};

export function hostToolRowToDecisionDefinition(
  row: HostToolDetailRow,
): HostToolDecisionDefinition {
  const argsSchema =
    row.argsSchema &&
    typeof row.argsSchema === 'object' &&
    !Array.isArray(row.argsSchema)
      ? (row.argsSchema as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    argsSchema,
    hostPageScope: row.hostPage?.scope ?? null,
    isRequired: false,
  };
}

export function assertPageActionScopeMatch(input: {
  pageScope: string | null | undefined;
  hostPageScope: string | null | undefined;
  pageContext: AgentChatPageContext | null | undefined;
}): void {
  const ctxPage = input.pageContext?.page?.trim();
  const requiredScope = input.pageScope?.trim() || input.hostPageScope?.trim();
  if (!requiredScope) {
    return;
  }
  if (!ctxPage) {
    throw new BadRequestException({
      code: 'INVALID_PAGE_CONTEXT',
      message: `pageContext.page is required for action scope "${requiredScope}"`,
    });
  }
  if (ctxPage !== requiredScope) {
    throw new BadRequestException({
      code: 'PAGE_SCOPE_MISMATCH',
      message: `pageContext.page "${ctxPage}" does not match required scope "${requiredScope}"`,
    });
  }
}

export function resolvePageActionHostTool(
  hostTool: HostToolDetailRow,
  pageContext: AgentChatPageContext | null | undefined,
): ResolvedPageActionHostTool {
  if (!hostTool.isActive) {
    throw new NotFoundException({
      code: 'HOST_TOOL_INACTIVE',
      message: `HostTool "${hostTool.name}" is not active`,
    });
  }
  const definition = hostToolRowToDecisionDefinition(hostTool);
  const streamablePath = resolveStreamablePathFromHostTool(definition);
  const hostPageScope = hostTool.hostPage?.scope ?? null;
  if (
    !canDispatchHostAction({
      pageContext: pageContext ?? null,
      hostPageScopes: [hostPageScope],
    })
  ) {
    throw new BadRequestException({
      code: 'HOST_ACTION_UNDISPATCHABLE',
      message: 'pageContext anchor is insufficient to dispatch host action',
    });
  }
  return { definition, streamablePath };
}
