import type { PrismaService } from '../../prisma/prisma.service';
import { applyWorkflowOverrides } from './apply-workflow-overrides.util';
import { materializeWorkflowGraphFromIr } from './materialize-workflow-graph-from-ir.util';
import { parseWorkflowIrDocument } from './parse-workflow-ir.util';
import { validateWorkflowIrTopology } from './validate-workflow-ir-topology.util';
import { isWorkflowCompatibleWithScope } from './validate-workflow-against-scope.util';
import { validateWorkflowTopology } from './validate-workflow.util';
import {
  buildNativeDirectGraphFromIr,
  isWorkflowIrNativeDirectEligible,
} from './workflow-ir-native-direct.util';
import { initWorkflowRun } from './workflow-run.util';
import type {
  LoadedWorkflowForRun,
  WorkflowLoadFailureReason,
  WorkflowLoadResult,
} from './load-workflow-definition.util';
import type { WorkflowEdge, WorkflowNodeDef, WorkflowOverrides } from './workflow.types';
import type { WorkflowIrDocument } from './workflow-ir.types';

export type FlowLoadResult = WorkflowLoadResult;

/**
 * 从 Flow 表加载。
 * Plan A：eligible direct-only IR → `ir_native_direct`（不走 expand materialize）；
 * 否则仍 materialize（含 llm / human_task / data_transform）。
 */
export async function loadFlowForRunDetailed(
  prisma: PrismaService,
  input: {
    flowId: number;
    appClientId: number;
    flowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
      allowedToolIds: number[];
      allowedHostToolIds: number[];
    };
  },
): Promise<FlowLoadResult> {
  const flow = await prisma.flow.findFirst({
    where: {
      id: input.flowId,
      appClientId: input.appClientId,
      isActive: true,
    },
  });
  if (!flow) {
    return {
      status: 'failed',
      reason: 'asset_missing',
      workflowId: input.flowId,
    };
  }

  let irJson: unknown = flow.ir;
  let version = flow.version;
  const pinVersion = input.flowVersion ?? null;
  if (pinVersion != null && pinVersion !== flow.version) {
    const revision = await prisma.flowRevision.findUnique({
      where: {
        flowId_version: { flowId: flow.id, version: pinVersion },
      },
    });
    if (!revision) {
      return {
        status: 'failed',
        reason: 'revision_missing',
        workflowId: flow.id,
      };
    }
    irJson = revision.ir;
    version = revision.version;
  }

  const ir = parseWorkflowIrDocument(irJson);
  if (!ir || ir.nodes.length === 0) {
    return {
      status: 'failed',
      reason: 'empty_nodes',
      workflowId: flow.id,
    };
  }

  const irTopologyIssues = validateWorkflowIrTopology(ir);
  if (irTopologyIssues.length > 0) {
    return {
      status: 'failed',
      reason: 'invalid_edges',
      workflowId: flow.id,
    };
  }

  let nodes: WorkflowNodeDef[];
  let edges: WorkflowEdge[];
  let entryNodeId: string;
  let materializedDirectFromIr: boolean;
  let executionMode: 'ir_native_direct' | 'materialized_expand';
  let irForRun: WorkflowIrDocument;
  let phasesByNodeId: Record<string, import('./workflow-ir-native-phase.util').WorkflowIrNativePhase> | undefined;

  // Plan A：native（含多相位）不经整图 expand materialize
  if (isWorkflowIrNativeDirectEligible(ir)) {
    try {
      const native = buildNativeDirectGraphFromIr(ir);
      nodes = native.nodes;
      edges = native.edges;
      entryNodeId = native.entryNodeId;
      materializedDirectFromIr = true;
      executionMode = 'ir_native_direct';
      irForRun = native.ir;
      phasesByNodeId = native.phasesByNodeId;
    } catch {
      return {
        status: 'failed',
        reason: 'invalid_edges',
        workflowId: flow.id,
      };
    }
  } else {
    let materialized: ReturnType<typeof materializeWorkflowGraphFromIr>;
    try {
      materialized = materializeWorkflowGraphFromIr(ir);
    } catch {
      return {
        status: 'failed',
        reason: 'invalid_edges',
        workflowId: flow.id,
      };
    }
    if (materialized.nodes.length === 0) {
      return {
        status: 'failed',
        reason: 'empty_nodes',
        workflowId: flow.id,
      };
    }
    nodes = materialized.nodes;
    edges = materialized.edges;
    entryNodeId = materialized.entryNodeId;
    materializedDirectFromIr = materialized.materializedDirectFromIr;
    executionMode = 'materialized_expand';
    irForRun = materialized.ir;
  }

  const topologyIssues = validateWorkflowTopology({
    nodes,
    edges,
    entryNodeId,
  });
  if (topologyIssues.length > 0) {
    return {
      status: 'failed',
      reason: 'invalid_edges',
      workflowId: flow.id,
    };
  }

  const overridden = applyWorkflowOverrides(nodes, input.workflowOverrides);

  if (input.scope) {
    const compatible = isWorkflowCompatibleWithScope({
      nodes: overridden,
      scope: input.scope,
    });
    if (!compatible) {
      return {
        status: 'failed',
        reason: 'scope_incompatible',
        workflowId: flow.id,
      };
    }
  }

  const workflowRun = initWorkflowRun({
    workflowId: flow.id,
    version,
    nodes: overridden,
    edges,
    entryNodeId,
    compiledFrom: 'flow_db',
    phasesByNodeId,
  });

  return {
    status: 'loaded',
    nodes: overridden,
    edges,
    entryNodeId,
    edgesDeclared: true,
    workflowRun,
    workflowId: flow.id,
    version,
    compiledFrom: 'flow_db',
    ir: irForRun,
    materializedDirectFromIr,
    executionMode,
  };
}

export async function loadFlowForRun(
  prisma: PrismaService,
  input: {
    flowId: number;
    appClientId: number;
    flowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
      allowedToolIds: number[];
      allowedHostToolIds: number[];
    };
  },
): Promise<LoadedWorkflowForRun | null> {
  const result = await loadFlowForRunDetailed(prisma, input);
  if (result.status === 'loaded') {
    const { status: _status, ...loaded } = result;
    return loaded;
  }
  return null;
}

export type { WorkflowLoadFailureReason };
