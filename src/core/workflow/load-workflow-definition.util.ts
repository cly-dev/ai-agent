import type { PrismaService } from '../../prisma/prisma.service';
import { applyWorkflowOverrides } from './apply-workflow-overrides.util';
import { initWorkflowRun } from './workflow-run.util';
import {
  readCachedWorkflowLoad,
  rememberWorkflowLoadCache,
  workflowLoadCacheKey,
} from './workflow-definition-cache.util';
import type {
  WorkflowDefinition,
  WorkflowNodeDef,
  WorkflowOverrides,
  WorkflowRunState,
} from './workflow.types';
import { isWorkflowCompatibleWithScope } from './validate-workflow-against-scope.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function parseWorkflowNodesJson(value: unknown): WorkflowNodeDef[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (row): row is WorkflowNodeDef =>
      isRecord(row) &&
      typeof row.id === 'string' &&
      typeof row.action === 'string' &&
      typeof row.name === 'string' &&
      typeof row.objective === 'string' &&
      isRecord(row.input),
  );
}

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
  workflowRun: WorkflowRunState;
  workflowId: number;
  version: number;
  compiledFrom: 'workflow_db';
};

export type WorkflowLoadFailureReason =
  | 'asset_missing'
  | 'revision_missing'
  | 'empty_nodes'
  | 'scope_incompatible';

export type WorkflowLoadResult =
  | ({ status: 'loaded' } & LoadedWorkflowForRun)
  | {
      status: 'failed';
      reason: WorkflowLoadFailureReason;
      workflowId: number;
    };

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

  let baseNodes = readCachedWorkflowLoad(
    cacheKey,
    workflow.updatedAt,
    revisionFingerprint,
    version,
  );
  if (!baseNodes) {
    baseNodes = parseWorkflowNodesJson(nodesJson);
    if (baseNodes.length > 0) {
      rememberWorkflowLoadCache(cacheKey, {
        workflowId: workflow.id,
        version,
        workflowUpdatedAt: workflow.updatedAt.toISOString(),
        revisionFingerprint,
        baseNodes,
      });
    }
  }

  if (baseNodes.length === 0) {
    return {
      status: 'failed',
      reason: 'empty_nodes',
      workflowId: workflow.id,
    };
  }

  const nodes = applyWorkflowOverrides(baseNodes, input.workflowOverrides);

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
    compiledFrom: 'workflow_db',
  });

  return {
    status: 'loaded',
    nodes,
    workflowRun,
    workflowId: workflow.id,
    version,
    compiledFrom: 'workflow_db',
  };
}

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
  return {
    workflowKey: row.workflowKey,
    name: row.name,
    profile: row.profile,
    goal: row.goal ?? null,
    constraints: Array.isArray(row.constraints)
      ? (row.constraints as string[])
      : [],
    nodes: parseWorkflowNodesJson(row.nodes),
  };
}
