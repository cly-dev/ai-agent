import type { Prisma } from '../../../../generated/prisma/client';
import {
  buildToolWhereFromFilters,
  type ToolListFilterInput,
} from '../../tool/tool-list-filter.util';
import type { AgentToolOrderByField } from '../dto/query-agent-tools.dto';

export function buildAgentToolBindingsWhere(
  agentId: number,
  appClientId: number,
  query: ToolListFilterInput,
): Prisma.AgentToolWhereInput {
  return {
    agentId,
    tool: buildToolWhereFromFilters(query, { appClientId }),
  };
}

export function buildAgentToolBindingsOrderBy(
  orderBy: AgentToolOrderByField | undefined,
  order: 'asc' | 'desc',
): Prisma.AgentToolOrderByWithRelationInput {
  const field = orderBy ?? 'toolId';
  if (field === 'toolId' || field === 'id') {
    return { [field]: order };
  }
  return { tool: { [field]: order } };
}
