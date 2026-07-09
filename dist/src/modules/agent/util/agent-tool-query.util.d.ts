import type { Prisma } from '../../../../generated/prisma/client';
import { type ToolListFilterInput } from '../../tool/tool-list-filter.util';
import type { AgentToolOrderByField } from '../dto/query-agent-tools.dto';
export declare function buildAgentToolBindingsWhere(agentId: number, appClientId: number, query: ToolListFilterInput): Prisma.AgentToolWhereInput;
export declare function buildAgentToolBindingsOrderBy(orderBy: AgentToolOrderByField | undefined, order: 'asc' | 'desc'): Prisma.AgentToolOrderByWithRelationInput;
