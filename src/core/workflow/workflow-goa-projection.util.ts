import type {
  ActiveTaskStatus,
  StoredTaskPlan,
  TaskStepProgress,
  TaskStepProgressStatus,
} from '../memory/goa/session-goa.types';
import type {
  WorkflowActionKind,
  WorkflowNodeStatus,
  WorkflowRunState,
} from './workflow.types';
import {
  projectIrRunNodeStatuses,
  resolveCurrentIrNodeId,
} from './project-ir-run-status.util';

function mapWorkflowNodeStatus(
  status: WorkflowNodeStatus,
): TaskStepProgressStatus {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'running':
      return 'running';
    case 'succeeded':
      return 'done';
    case 'failed':
      return 'failed';
    case 'skipped':
      return 'skipped';
    default:
      return 'pending';
  }
}

function workflowActionToKind(action: WorkflowActionKind): string {
  switch (action) {
    case 'fetch_data':
    case 'compose_mutation':
    case 'write_data':
      return 'tool';
    case 'generate_and_push':
      return 'host_tool';
    case 'summarize':
    case 'present_mutation':
      return 'summarize';
    case 'summarize_images':
      return 'image_context';
    case 'await_user_confirm':
      return 'confirm';
    case 'detect_clues':
      return 'judge';
    default:
      return action;
  }
}

function workflowActionToPhase(action: WorkflowActionKind): string {
  switch (action) {
    case 'fetch_data':
    case 'summarize_images':
    case 'detect_clues':
      return 'gather';
    case 'compose_mutation':
      return 'analyze';
    case 'write_data':
    case 'await_user_confirm':
      return 'mutate';
    default:
      return 'answer';
  }
}

function findPlanStepForWorkflowNode(
  plan: StoredTaskPlan,
  nodeId: string,
): StoredTaskPlan['steps'][number] | undefined {
  return (
    plan.steps.find((step) => step.id === nodeId) ??
    plan.steps.find((step) => step.id.startsWith(`${nodeId}:`))
  );
}

export function buildStepProgressFromWorkflowRun(input: {
  workflowRun: WorkflowRunState;
  plan: StoredTaskPlan;
}): TaskStepProgress[] {
  return input.workflowRun.nodes.map((node) => {
    const planStep = findPlanStepForWorkflowNode(input.plan, node.nodeId);
    return {
      stepId: node.nodeId,
      phase: planStep?.phase ?? workflowActionToPhase(node.action),
      kind: planStep?.kind ?? workflowActionToKind(node.action),
      status: mapWorkflowNodeStatus(node.status),
      ...(node.outputRef ? { artifactRef: node.outputRef } : {}),
      ...(node.error?.message ? { summary: node.error.message } : {}),
    };
  });
}

export function resolveActiveTaskStatusFromWorkflow(input: {
  workflowRun: WorkflowRunState;
  plan: StoredTaskPlan;
  runStatus?: 'success' | 'failed';
  awaitingWriteConfirmation?: boolean;
}): ActiveTaskStatus {
  if (input.awaitingWriteConfirmation) {
    return 'awaiting_confirmation';
  }
  if (input.runStatus === 'failed' || input.workflowRun.status === 'failed') {
    return 'failed';
  }
  if (input.workflowRun.status === 'completed') {
    return 'completed';
  }
  const current = input.workflowRun.currentNodeId;
  if (current) {
    const node = input.workflowRun.nodes.find((row) => row.nodeId === current);
    if (node?.action === 'await_user_confirm' && node.status === 'running') {
      return 'awaiting_confirmation';
    }
  }
  return 'in_progress';
}

export function formatWorkflowRunPendingSummary(
  workflowRun: WorkflowRunState,
): string {
  const pending = workflowRun.nodes
    .filter((row) => row.status === 'pending' || row.status === 'running')
    .map((row) => `${row.nodeId}(${row.action}/${row.status})`);
  const current = workflowRun.currentNodeId
    ? `current=${workflowRun.currentNodeId}`
    : 'current=none';
  const currentIr = resolveCurrentIrNodeId(workflowRun);
  const irPart =
    currentIr != null && currentIr !== workflowRun.currentNodeId
      ? ` currentIr=${currentIr}`
      : '';
  const irProj = projectIrRunNodeStatuses(workflowRun)
    .filter((row) => row.status === 'pending' || row.status === 'running')
    .map((row) => `${row.irNodeId}(${row.irType ?? '?'}/${row.status})`);
  const irPending =
    irProj.length > 0 && irProj.join(',') !== pending.join(',')
      ? `; irPending=${irProj.join(', ') || 'none'}`
      : '';
  return `workflowStatus=${workflowRun.status}; ${current}${irPart}; pending=${pending.join(', ') || 'none'}${irPending}`;
}
