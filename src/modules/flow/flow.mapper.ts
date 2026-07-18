import { toHostToolResponse } from '../host-tool/host-tool.mapper';
import type {
  FlowDetailRow,
  FlowListItem,
  FlowListRow,
  FlowResponse,
  FlowRevisionResponse,
  FlowRevisionSummaryResponse,
} from './flow.types';

function mapCore(row: FlowDetailRow | FlowListRow) {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient.name,
    flowKey: row.flowKey,
    name: row.name,
    description: row.description,
    profile: row.profile,
    deliverable: row.deliverable,
    version: row.version,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    skillRefCount: row._count.skills,
    pageActionRefCount: row._count.pageActions,
  };
}

export function toFlowResponse(row: FlowDetailRow): FlowResponse {
  return {
    ...mapCore(row),
    goal: row.goal,
    intent: row.intent,
    ir: row.ir,
    constraints: row.constraints,
    flowTools: row.flowTools.map((b) => ({
      id: b.id,
      toolId: b.toolId,
      isRequired: b.isRequired,
      tool: b.tool,
    })),
    flowHostTools: row.flowHostTools.map((b) => ({
      id: b.id,
      hostToolId: b.hostToolId,
      isRequired: b.isRequired,
      hostTool: toHostToolResponse(b.hostTool),
    })),
    revisionCount: row._count.revisions,
  };
}

export function toFlowListItem(row: FlowListRow): FlowListItem {
  const ir = row.ir as { nodes?: unknown[] } | null;
  const irNodeCount = Array.isArray(ir?.nodes) ? ir.nodes.length : 0;
  return {
    ...mapCore(row),
    irNodeCount,
  };
}

export function toFlowRevisionResponse(
  row: {
    id: number;
    flowId: number;
    version: number;
    deliverable: string;
    intent: unknown;
    ir: unknown;
    constraints: unknown;
    changeNote: string | null;
    createdAt: Date;
  },
  currentVersion: number,
): FlowRevisionResponse {
  return {
    id: row.id,
    flowId: row.flowId,
    version: row.version,
    deliverable: row.deliverable,
    intent: row.intent,
    ir: row.ir,
    constraints: row.constraints,
    changeNote: row.changeNote,
    createdAt: row.createdAt,
    isCurrent: row.version === currentVersion,
  };
}

export function toFlowRevisionSummaryResponse(
  row: {
    id: number;
    flowId: number;
    version: number;
    deliverable: string;
    changeNote: string | null;
    createdAt: Date;
  },
  currentVersion: number,
): FlowRevisionSummaryResponse {
  return {
    id: row.id,
    flowId: row.flowId,
    version: row.version,
    deliverable: row.deliverable,
    changeNote: row.changeNote,
    createdAt: row.createdAt,
    isCurrent: row.version === currentVersion,
  };
}
