import type { WorkflowEdge, WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';
import type { ParsedWorkflowGraph } from './graph/workflow-edge.util';

const WORKFLOW_LOAD_CACHE_TTL_MS = 5 * 60_000;

type WorkflowLoadCacheEntry = {
  expiresAt: number;
  workflowId: number;
  version: number;
  workflowUpdatedAt: string;
  revisionFingerprint: string | null;
  baseNodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId: string | null;
  edgesDeclared: boolean;
  edgeParseIssues: WorkflowValidationIssue[];
};

const workflowLoadCache = new Map<string, WorkflowLoadCacheEntry>();

export function workflowLoadCacheKey(input: {
  appClientId: number;
  workflowId: number;
  workflowVersion?: number | null;
}): string {
  const version = input.workflowVersion ?? 'head';
  return `${input.appClientId}:${input.workflowId}:${version}`;
}

export function readCachedWorkflowLoad(
  key: string,
  workflowUpdatedAt: Date,
  revisionFingerprint: string | null,
  resolvedVersion: number,
): ParsedWorkflowGraph | null {
  const cached = workflowLoadCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    workflowLoadCache.delete(key);
    return null;
  }
  if (
    cached.workflowUpdatedAt !== workflowUpdatedAt.toISOString() ||
    cached.revisionFingerprint !== revisionFingerprint ||
    cached.version !== resolvedVersion
  ) {
    workflowLoadCache.delete(key);
    return null;
  }
  return {
    nodes: cached.baseNodes,
    edges: cached.edges,
    entryNodeId: cached.entryNodeId,
    edgesDeclared: cached.edgesDeclared,
    edgeParseIssues: cached.edgeParseIssues,
  };
}

export function rememberWorkflowLoadCache(
  key: string,
  entry: {
    workflowId: number;
    version: number;
    workflowUpdatedAt: string;
    revisionFingerprint: string | null;
    graph: ParsedWorkflowGraph;
  },
): void {
  workflowLoadCache.set(key, {
    expiresAt: Date.now() + WORKFLOW_LOAD_CACHE_TTL_MS,
    workflowId: entry.workflowId,
    version: entry.version,
    workflowUpdatedAt: entry.workflowUpdatedAt,
    revisionFingerprint: entry.revisionFingerprint,
    baseNodes: entry.graph.nodes,
    edges: entry.graph.edges,
    entryNodeId: entry.graph.entryNodeId,
    edgesDeclared: entry.graph.edgesDeclared,
    edgeParseIssues: entry.graph.edgeParseIssues,
  });
}
