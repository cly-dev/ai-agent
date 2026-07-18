import type { PrismaService } from '../../prisma/prisma.service';
import { applyWorkflowOverrides } from './apply-workflow-overrides.util';
import { initWorkflowRun } from './workflow-run.util';
import {
  readCachedWorkflowLoad,
  rememberWorkflowLoadCache,
  workflowLoadCacheKey,
} from './workflow-definition-cache.util';
import {
  parseWorkflowGraphJson,
  serializeWorkflowGraphJson,
  type ParsedWorkflowGraph,
} from './graph/workflow-edge.util';
import type {
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowNodeDef,
  WorkflowOverrides,
  WorkflowRunState,
} from './workflow.types';
import { isWorkflowCompatibleWithScope } from './validate-workflow-against-scope.util';
import { validateWorkflowTopology } from './validate-workflow.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** @deprecated Prefer parseWorkflowGraphJson; retains nodes-only extraction. */
export function parseWorkflowNodesJson(value: unknown): WorkflowNodeDef[] {
  return parseWorkflowGraphJson(value).nodes;
}

export {
  parseWorkflowGraphJson,
  serializeWorkflowGraphJson,
  type ParsedWorkflowGraph,
};

export function parseWorkflowOverridesJson(
  value: unknown,
): WorkflowOverrides | null {
  if (!isRecord(value)) {
    return null;
  }
  const overrides: WorkflowOverrides = {};
  for (const [nodeId, patch] of Object.entries(value)) {
    if (!isRecord(patch)) {
      continue;
    }
    if (typeof patch.objective === 'string') {
      overrides[nodeId] = { objective: patch.objective };
    }
  }
  return Object.keys(overrides).length > 0 ? overrides : null;
}

export type LoadedWorkflowForRun = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId: string | null;
  edgesDeclared: boolean;
  workflowRun: WorkflowRunState;
  workflowId: number;
  version: number;
  compiledFrom: 'workflow_db' | 'flow_db';
  /** Flow 编译 IR 快照；legacy Workflow 加载无此字段 */
  ir?: import('./workflow-ir.types').WorkflowIrDocument;
  /** direct-only 物化时为 true（未走 expand） */
  materializedDirectFromIr?: boolean;
  /**
   * Plan A：`ir_native_direct` = 图真源为 IR（仅 direct 节点）；
   * `materialized_expand` = 仍经 expand materialize。
   */
  executionMode?: import('./workflow-ir-native-direct.util').WorkflowExecutionMode;
};

export type WorkflowLoadFailureReason =
  | 'asset_missing'
  | 'revision_missing'
  | 'empty_nodes'
  | 'invalid_edges'
  | 'scope_incompatible';

export type WorkflowLoadResult =
  | ({ status: 'loaded' } & LoadedWorkflowForRun)
  | {
      status: 'failed';
      reason: WorkflowLoadFailureReason;
      workflowId: number;
    };

/**
 * @deprecated 当前运行时只认 Flow（`loadFlowForRunDetailed`）。
 * 本函数保留给未来「独立 Workflow 链路 / Runtime」，勿在 Skill/PageAction/Chat 现网路径调用。
 * Admin migrate / 归档读表请用 Prisma 或专用 util，不要把它当兼容回退。
 */
export async function loadWorkflowForRunDetailed(
  prisma: PrismaService,
  input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
      allowedToolIds: number[];
      allowedHostToolIds: number[];
    };
  },
): Promise<WorkflowLoadResult> {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: input.workflowId,
      appClientId: input.appClientId,
      isActive: true,
    },
    include: {
      workflowTools: true,
      workflowHostTools: true,
    },
  });
  if (!workflow) {
    return {
      status: 'failed',
      reason: 'asset_missing',
      workflowId: input.workflowId,
    };
  }

  const pinVersion = input.workflowVersion ?? null;
  const cacheKey = workflowLoadCacheKey(input);
  let nodesJson: unknown = workflow.nodes;
  let version = workflow.version;
  let revisionFingerprint: string | null = null;

  if (pinVersion != null && pinVersion !== workflow.version) {
    const revision = await prisma.workflowRevision.findUnique({
      where: {
        workflowId_version: {
          workflowId: workflow.id,
          version: pinVersion,
        },
      },
    });
    if (!revision) {
      return {
        status: 'failed',
        reason: 'revision_missing',
        workflowId: workflow.id,
      };
    }
    nodesJson = revision.nodes;
    version = revision.version;
    revisionFingerprint = `${revision.id}:${revision.createdAt.toISOString()}`;
  }

  let graph = readCachedWorkflowLoad(
    cacheKey,
    workflow.updatedAt,
    revisionFingerprint,
    version,
  );
  const fromCache = graph != null;
  if (!graph) {
    graph = parseWorkflowGraphJson(nodesJson);
  }

  if (graph.nodes.length === 0) {
    return {
      status: 'failed',
      reason: 'empty_nodes',
      workflowId: workflow.id,
    };
  }

  // detect 必须带声明边；禁止无 edges 字段时静默合成线性 always
  const hasDetectClues = graph.nodes.some(
    (node) => node.action === 'detect_clues',
  );
  if (hasDetectClues && !graph.edgesDeclared) {
    return {
      status: 'failed',
      reason: 'invalid_edges',
      workflowId: workflow.id,
    };
  }

  // 声明了 edges：解析失败 / 空边 / 拓扑非法 → fail closed
  if (graph.edgesDeclared) {
    if (
      graph.edgeParseIssues.length > 0 ||
      (graph.nodes.length > 1 && graph.edges.length === 0)
    ) {
      return {
        status: 'failed',
        reason: 'invalid_edges',
        workflowId: workflow.id,
      };
    }
    const topologyIssues = validateWorkflowTopology({
      nodes: graph.nodes,
      edges: graph.edges,
      entryNodeId: graph.entryNodeId,
    });
    if (topologyIssues.length > 0) {
      return {
        status: 'failed',
        reason: 'invalid_edges',
        workflowId: workflow.id,
      };
    }
  }

  // 仅缓存校验通过的图，避免 invalid_edges 脏数据占坑
  if (!fromCache) {
    rememberWorkflowLoadCache(cacheKey, {
      workflowId: workflow.id,
      version,
      workflowUpdatedAt: workflow.updatedAt.toISOString(),
      revisionFingerprint,
      graph,
    });
  }

  const nodes = applyWorkflowOverrides(graph.nodes, input.workflowOverrides);

  if (input.scope) {
    const compatible = isWorkflowCompatibleWithScope({
      nodes,
      scope: input.scope,
    });
    if (!compatible) {
      return {
        status: 'failed',
        reason: 'scope_incompatible',
        workflowId: workflow.id,
      };
    }
  }

  const workflowRun = initWorkflowRun({
    workflowId: workflow.id,
    version,
    nodes,
    edges: graph.edges,
    entryNodeId: graph.entryNodeId,
    compiledFrom: 'workflow_db',
  });

  return {
    status: 'loaded',
    nodes,
    edges: graph.edges,
    entryNodeId: graph.entryNodeId,
    edgesDeclared: graph.edgesDeclared,
    workflowRun,
    workflowId: workflow.id,
    version,
    compiledFrom: 'workflow_db',
  };
}

/** @deprecated 见 `loadWorkflowForRunDetailed`；现网请用 `loadFlowForRun`。 */
export async function loadWorkflowForRun(
  prisma: PrismaService,
  input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
      allowedToolIds: number[];
      allowedHostToolIds: number[];
    };
  },
): Promise<LoadedWorkflowForRun | null> {
  const result = await loadWorkflowForRunDetailed(prisma, input);
  if (result.status === 'loaded') {
    const { status: _status, ...loaded } = result;
    return loaded;
  }
  return null;
}

export function toWorkflowDefinition(row: {
  workflowKey: string;
  name: string;
  profile: WorkflowDefinition['profile'];
  goal?: string | null;
  constraints?: unknown;
  nodes: unknown;
}): WorkflowDefinition {
  const graph = parseWorkflowGraphJson(row.nodes);
  return {
    workflowKey: row.workflowKey,
    name: row.name,
    profile: row.profile,
    goal: row.goal ?? null,
    constraints: Array.isArray(row.constraints)
      ? (row.constraints as string[])
      : [],
    nodes: graph.nodes,
    ...(graph.edgesDeclared
      ? { edges: graph.edges, entryNodeId: graph.entryNodeId ?? undefined }
      : {}),
  };
}
