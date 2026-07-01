import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  isWorkflowDebugEnabled,
  isWorkflowFileDebugEnabled,
} from '../../security/file-debug-log.util';
import type { WorkflowRunState } from '../workflow.types';

export type WorkflowDebugRecord = {
  component: 'workflow';
  stage: string;
  writtenAt: string;
} & Record<string, unknown>;

function resolveWorkflowLogFile(payload: Record<string, unknown>): string {
  const dir = path.join(process.cwd(), 'logs', 'workflow');
  const runId = payload.runId;
  if (typeof runId === 'number' && Number.isFinite(runId)) {
    return path.join(dir, `run-${runId}.log`);
  }
  const actionRunId = payload.actionRunId;
  if (typeof actionRunId === 'number' && Number.isFinite(actionRunId)) {
    const actionKey =
      typeof payload.actionKey === 'string' && payload.actionKey.trim()
        ? `-${payload.actionKey.trim().replace(/[^a-zA-Z0-9_-]+/g, '_')}`
        : '';
    return path.join(dir, `page-action-${actionRunId}${actionKey}.log`);
  }
  const sessionId = payload.sessionId;
  if (typeof sessionId === 'string' && sessionId.trim()) {
    return path.join(dir, `session-${sessionId.trim()}.log`);
  }
  return path.join(dir, 'misc.log');
}

function truncateJson(value: unknown, maxLen = 48_000): string {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen)}\n…[truncated totalLen=${text.length}]`;
}

function summarizeWorkflowRun(
  run: WorkflowRunState | null | undefined,
): Record<string, unknown> | null {
  if (!run) {
    return null;
  }
  return {
    workflowId: run.workflowId,
    version: run.version,
    status: run.status,
    compiledFrom: run.compiledFrom ?? null,
    currentNodeId: run.currentNodeId,
    nodes: run.nodes.map((row) => ({
      nodeId: row.nodeId,
      action: row.action,
      status: row.status,
      outputRef: row.outputRef ?? null,
      error: row.error ?? null,
    })),
  };
}

function appendWorkflowBlock(
  file: string,
  stage: string,
  record: WorkflowDebugRecord,
): void {
  const header = [
    `WORKFLOW  stage=${stage}`,
    `writtenAt=${record.writtenAt}`,
    record.runId != null ? `runId=${record.runId}` : null,
    record.sessionId != null ? `sessionId=${record.sessionId}` : null,
    record.turnId != null ? `turnId=${record.turnId}` : null,
    record.actionRunId != null ? `actionRunId=${record.actionRunId}` : null,
    record.nodeId != null ? `nodeId=${record.nodeId}` : null,
    record.action != null ? `action=${record.action}` : null,
    record.outcome != null ? `outcome=${record.outcome}` : null,
  ]
    .filter((part): part is string => part != null)
    .join('  ');

  const block = [
    '',
    '─'.repeat(72),
    header,
    '─'.repeat(72),
    truncateJson(record),
    '',
  ].join('\n');
  fs.appendFileSync(file, block, 'utf-8');
}

/**
 * 追加 workflow 调试块到 `logs/workflow/run-{runId}.log`（或 page-action / session 归档）。
 * 需 `WORKFLOW_DEBUG=1` 或非生产默认 `AGENT_ENGINE_DEBUG`；生产环境不写文件。
 */
export function logWorkflowDebug(
  stage: string,
  payload: Record<string, unknown> & {
    workflowRun?: WorkflowRunState | null;
  },
): string | null {
  if (!isWorkflowDebugEnabled() || !isWorkflowFileDebugEnabled()) {
    return null;
  }

  const { workflowRun, ...rest } = payload;
  const record: WorkflowDebugRecord = {
    component: 'workflow',
    stage,
    writtenAt: new Date().toISOString(),
    ...rest,
    ...(workflowRun != null
      ? { workflowRunSummary: summarizeWorkflowRun(workflowRun) }
      : {}),
  };

  try {
    const file = resolveWorkflowLogFile(payload);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    appendWorkflowBlock(file, stage, record);
    return file;
  } catch {
    return null;
  }
}

export function logWorkflowGraphBoot(input: {
  runId: number;
  sessionId: string;
}): string | null {
  return logWorkflowDebug('graph_boot', {
    runId: input.runId,
    sessionId: input.sessionId,
    workflowGraphVersion: 'v2',
  });
}

export { isWorkflowDebugEnabled, isWorkflowFileDebugEnabled };
