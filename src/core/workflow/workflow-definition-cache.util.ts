import type { WorkflowNodeDef } from './workflow.types';

const WORKFLOW_LOAD_CACHE_TTL_MS = 5 * 60_000;

type WorkflowLoadCacheEntry = {
  expiresAt: number;
  workflowId: number;
  version: number;
  workflowUpdatedAt: string;
  revisionFingerprint: string | null;
  baseNodes: WorkflowNodeDef[];
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
): WorkflowNodeDef[] | null {
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
  return cached.baseNodes;
}

export function rememberWorkflowLoadCache(
  key: string,
  entry: Omit<WorkflowLoadCacheEntry, 'expiresAt'>,
): void {
  workflowLoadCache.set(key, {
    ...entry,
    expiresAt: Date.now() + WORKFLOW_LOAD_CACHE_TTL_MS,
  });
}
