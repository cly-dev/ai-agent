import { toHostToolResponse } from '../host-tool/host-tool.mapper';
import type {
  WorkflowDetailRow,
  WorkflowListRow,
  WorkflowListItem,
  WorkflowResponse,
  WorkflowRevisionResponse,
  WorkflowRevisionSummaryResponse,
} from './workflow.types';

function mapToolBindings(row: WorkflowDetailRow) {
  return row.workflowTools.map((binding) => ({
    id: binding.id,
    toolId: binding.toolId,
    isRequired: binding.isRequired,
    tool: binding.tool,
  }));
}

function mapHostToolBindings(row: WorkflowDetailRow) {
  return row.workflowHostTools.map((binding) => ({
    id: binding.id,
    hostToolId: binding.hostToolId,
    isRequired: binding.isRequired,
    hostTool: toHostToolResponse(binding.hostTool),
  }));
}

function mapWorkflowCore(row: WorkflowDetailRow | WorkflowListRow) {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient.name,
    workflowKey: row.workflowKey,
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

export function toWorkflowResponse(row: WorkflowDetailRow): WorkflowResponse {
  return {
    ...mapWorkflowCore(row),
    goal: row.goal,
    nodes: row.nodes,
    constraints: row.constraints,
    workflowTools: mapToolBindings(row),
    workflowHostTools: mapHostToolBindings(row),
    revisionCount: row._count.revisions,
  };
}

export function toWorkflowListItem(row: WorkflowListRow): WorkflowListItem {
  const nodes = Array.isArray(row.nodes) ? row.nodes : [];
  return {
    ...mapWorkflowCore(row),
    nodeCount: nodes.length,
  };
}

export function toWorkflowRevisionResponse(
  row: {
    id: number;
    workflowId: number;
    version: number;
    deliverable: string;
    nodes: unknown;
    constraints: unknown;
    changeNote: string | null;
    createdAt: Date;
  },
  currentVersion: number,
): WorkflowRevisionResponse {
  return {
    id: row.id,
    workflowId: row.workflowId,
    version: row.version,
    deliverable: row.deliverable,
    nodes: row.nodes,
    constraints: row.constraints,
    changeNote: row.changeNote,
    createdAt: row.createdAt,
    isCurrent: row.version === currentVersion,
  };
}

export function toWorkflowRevisionSummaryResponse(
  row: {
    id: number;
    workflowId: number;
    version: number;
    deliverable: string;
    changeNote: string | null;
    createdAt: Date;
  },
  currentVersion: number,
): WorkflowRevisionSummaryResponse {
  return {
    id: row.id,
    workflowId: row.workflowId,
    version: row.version,
    deliverable: row.deliverable,
    changeNote: row.changeNote,
    createdAt: row.createdAt,
    isCurrent: row.version === currentVersion,
  };
}
