import type { Prisma } from '../../../generated/prisma/client';

export const AGENT_RUN_DETAIL_INCLUDE = {
  turn: {
    select: {
      id: true,
      status: true,
      userInput: true,
      finalOutput: true,
      createdAt: true,
    },
  },
  agent: { select: { id: true, name: true, appClientId: true } },
  appClient: { select: { id: true, name: true } },
  session: { select: { id: true, title: true } },
  parentRun: { select: { id: true, status: true, role: true, sequence: true } },
  childRuns: {
    orderBy: { sequence: 'asc' as const },
    select: { id: true, status: true, role: true, sequence: true },
  },
} satisfies Prisma.AgentRunInclude;

export type AgentRunDetailRow = Prisma.AgentRunGetPayload<{
  include: typeof AGENT_RUN_DETAIL_INCLUDE;
}>;

export type ToolQualityCounts = {
  high: number;
  medium: number;
  low: number;
};

export type ToolMachineCodeCounts = {
  INTENT_RECALL_FAILED: number;
  TOOL_AUTH_FAILED: number;
  TOOL_TIMEOUT: number;
  TOOL_EMPTY_RESULT: number;
  TOOL_DOWNSTREAM_ERROR: number;
  LLM_TIMEOUT: number;
  LLM_RATE_LIMIT: number;
};

export type AgentRunResponse = AgentRunDetailRow & {
  toolsUsed: string[] | null;
  toolQualityCounts: ToolQualityCounts | null;
  toolMachineCodeCounts: ToolMachineCodeCounts | null;
};
