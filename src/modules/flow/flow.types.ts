import type { Prisma } from '../../../generated/prisma/client';
import { AGENT_LINKED_TOOL_SELECT } from '../agent/types/agent.types';
import {
  HOST_TOOL_DETAIL_INCLUDE,
  type HostToolResponse,
} from '../host-tool/host-tool.types';

export const FLOW_DETAIL_INCLUDE = {
  appClient: { select: { id: true, name: true, dsn: true } },
  flowTools: {
    orderBy: { toolId: 'asc' as const },
    include: {
      tool: { select: AGENT_LINKED_TOOL_SELECT },
    },
  },
  flowHostTools: {
    orderBy: { hostToolId: 'asc' as const },
    include: {
      hostTool: { include: HOST_TOOL_DETAIL_INCLUDE },
    },
  },
  _count: {
    select: {
      skills: true,
      pageActions: true,
      revisions: true,
    },
  },
} satisfies Prisma.FlowInclude;

export const FLOW_LIST_INCLUDE = {
  appClient: { select: { id: true, name: true, dsn: true } },
  _count: {
    select: {
      skills: true,
      pageActions: true,
    },
  },
} satisfies Prisma.FlowInclude;

export type FlowDetailRow = Prisma.FlowGetPayload<{
  include: typeof FLOW_DETAIL_INCLUDE;
}>;

export type FlowListRow = Prisma.FlowGetPayload<{
  include: typeof FLOW_LIST_INCLUDE;
}>;

export type FlowResponse = {
  id: number;
  appClientId: number;
  appClientName: string;
  flowKey: string;
  name: string;
  description: string | null;
  goal: string | null;
  profile: string;
  deliverable: string;
  intent: unknown;
  ir: unknown;
  version: number;
  constraints: unknown;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  flowTools: Array<{
    id: number;
    toolId: number;
    isRequired: boolean;
    tool: Prisma.ToolGetPayload<{ select: typeof AGENT_LINKED_TOOL_SELECT }>;
  }>;
  flowHostTools: Array<{
    id: number;
    hostToolId: number;
    isRequired: boolean;
    hostTool: HostToolResponse;
  }>;
  skillRefCount: number;
  pageActionRefCount: number;
  revisionCount: number;
};

export type FlowListItem = Omit<
  FlowResponse,
  | 'flowTools'
  | 'flowHostTools'
  | 'revisionCount'
  | 'intent'
  | 'ir'
  | 'constraints'
  | 'goal'
> & {
  irNodeCount: number;
};

export type FlowRevisionResponse = {
  id: number;
  flowId: number;
  version: number;
  deliverable: string;
  intent: unknown;
  ir: unknown;
  constraints: unknown;
  changeNote: string | null;
  createdAt: Date;
  isCurrent: boolean;
};

export type FlowRevisionSummaryResponse = Omit<
  FlowRevisionResponse,
  'intent' | 'ir' | 'constraints'
>;

export type MigrateFlowFromWorkflowResponse = {
  flow: FlowResponse;
  sourceWorkflowId: number;
  matchedPattern: string;
  warnings: string[];
  rebind: {
    skillsUpdated: number;
    pageActionsUpdated: number;
  };
  sourceDeactivated: boolean;
};

/** 迁移前预览：不写库，供 B 端确认 warnings / 改绑范围。 */
export type MigrateFlowFromWorkflowPreview = {
  sourceWorkflowId: number;
  suggestedFlowKey: string;
  profile: string;
  canMigrate: boolean;
  /** 推断丢失 clue 扇出等时为 true；仍可迁移但需人工核对 Intent */
  lossy: boolean;
  matchedPattern: string | null;
  warnings: string[];
  intent: unknown | null;
  error: { code: string; message: string } | null;
  flowKeyAvailable: boolean;
  rebind: {
    skillCount: number;
    pageActionCount: number;
  };
};

/** 仍绑 workflowId、建议迁到 Flow 的存量资产。 */
export type FlowMigrationCandidate = {
  workflowId: number;
  workflowKey: string;
  name: string;
  profile: string;
  isActive: boolean;
  skillRefCount: number;
  pageActionRefCount: number;
  previewPath: string;
  migratePath: string;
};
