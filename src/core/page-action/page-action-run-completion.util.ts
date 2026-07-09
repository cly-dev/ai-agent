import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type {
  WorkflowActionKind,
  WorkflowNodeDef,
  WorkflowRunNodeState,
  WorkflowRunState,
} from '../workflow/workflow.types';

/** PageAction / PageWorkflow 编排完成时的交付语义（终态层只消费此结构）。 */
export type PageActionRunCompletion =
  | { kind: 'suspended'; approvalRequestId: number }
  | { kind: 'failed'; errorCode: string; errorMessage: string }
  | { kind: 'text'; fillText: string; dslOutcome?: string | null }
  | { kind: 'http_write'; nodeId: string; toolName?: string | null }
  | { kind: 'http_read'; nodeId: string; toolName?: string | null }
  | { kind: 'workflow_done' };

const TEXT_TERMINAL_ACTIONS = new Set<WorkflowActionKind>([
  'summarize',
  'generate_and_push',
]);

function dslDispatchFailedCompletion(
  fillText: string,
): PageActionRunCompletion {
  return {
    kind: 'failed',
    errorCode: 'DSL_DISPATCH_FAILED',
    errorMessage:
      fillText.trim().length > 0
        ? 'LLM produced text but host_action DSL finalize failed'
        : 'Host action DSL stream did not finalize',
  };
}

function completionFromTextWithDsl(input: {
  fillText: string;
  dslOutcome?: string | null;
}): PageActionRunCompletion {
  const fillText = input.fillText.trim();
  if (!fillText) {
    return {
      kind: 'failed',
      errorCode: 'STREAM_EMPTY',
      errorMessage: 'LLM produced empty fill text',
    };
  }
  if (input.dslOutcome === 'failed') {
    return dslDispatchFailedCompletion(fillText);
  }
  return { kind: 'text', fillText, dslOutcome: input.dslOutcome ?? null };
}

export function completionFromHostFill(input: {
  fillText: string;
  dslOutcome: string | null;
}): PageActionRunCompletion {
  return completionFromTextWithDsl({
    fillText: input.fillText,
    dslOutcome: input.dslOutcome,
  });
}

export function completionFromSummarizeText(
  summaryText: string,
  dslOutcome?: string | null,
): PageActionRunCompletion {
  const fillText = summaryText.trim();
  if (!fillText) {
    return {
      kind: 'failed',
      errorCode: 'STREAM_EMPTY',
      errorMessage: 'LLM produced empty summary text',
    };
  }
  if (dslOutcome === 'failed') {
    return dslDispatchFailedCompletion(fillText);
  }
  return { kind: 'text', fillText, dslOutcome: dslOutcome ?? null };
}

function readToolNameFromNodeOutput(
  nodeOutputs: Record<string, unknown> | undefined,
  nodeId: string,
): string | null {
  const raw = nodeOutputs?.[nodeId];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  if (typeof row.toolName === 'string' && row.toolName.trim()) {
    return row.toolName.trim();
  }
  if (typeof row.tool === 'string' && row.tool.trim()) {
    return row.tool.trim();
  }
  return null;
}

function getWorkflowRunNode(
  workflowRun: WorkflowRunState,
  nodeId: string,
): WorkflowRunNodeState | undefined {
  return workflowRun.nodes.find((row) => row.nodeId === nodeId);
}

function failedWorkflowCompletion(
  workflowRun: WorkflowRunState,
): PageActionRunCompletion {
  const failedNode = workflowRun.nodes.find((row) => row.status === 'failed');
  return {
    kind: 'failed',
    errorCode: failedNode?.error?.code ?? 'WORKFLOW_FAILED',
    errorMessage: failedNode?.error?.message ?? 'Workflow run failed',
  };
}

function resolveHttpTerminalCompletion(input: {
  workflowNodes: WorkflowNodeDef[];
  workflowRun: WorkflowRunState;
  nodeOutputs: Record<string, unknown>;
}): PageActionRunCompletion | null {
  if (input.workflowRun.status !== 'completed') {
    return null;
  }

  const lastDef = input.workflowNodes[input.workflowNodes.length - 1];
  if (!lastDef) {
    return null;
  }

  const lastRun = getWorkflowRunNode(input.workflowRun, lastDef.id);

  if (lastDef.action === 'write_data' && lastRun?.status === 'succeeded') {
    return {
      kind: 'http_write',
      nodeId: lastDef.id,
      toolName: readToolNameFromNodeOutput(input.nodeOutputs, lastDef.id),
    };
  }

  if (lastDef.action === 'fetch_data' && lastRun?.status === 'succeeded') {
    return {
      kind: 'http_read',
      nodeId: lastDef.id,
      toolName: readToolNameFromNodeOutput(input.nodeOutputs, lastDef.id),
    };
  }

  return null;
}

/**
 * Workflow 编排结束时解析 completion（SSOT）。
 * 按末节点 action + workflowRun 节点状态决定交付类型，不再在终态层反推。
 */
export function resolvePageWorkflowCompletion(input: {
  workflowNodes: WorkflowNodeDef[];
  workflowRun: WorkflowRunState;
  runtime: Pick<PageWorkflowExecutorRuntime, 'fillText' | 'dslOutcome' | 'nodeOutputs'>;
  errorCode?: string | null;
  errorMessage?: string | null;
  suspended?: boolean;
  approvalRequestId?: number | null;
}): PageActionRunCompletion {
  if (input.suspended && input.approvalRequestId != null) {
    return { kind: 'suspended', approvalRequestId: input.approvalRequestId };
  }

  if (input.errorCode?.trim()) {
    return {
      kind: 'failed',
      errorCode: input.errorCode.trim(),
      errorMessage: input.errorMessage?.trim() || input.errorCode.trim(),
    };
  }

  if (input.workflowRun.status === 'failed') {
    return failedWorkflowCompletion(input.workflowRun);
  }

  const httpTerminal = resolveHttpTerminalCompletion({
    workflowNodes: input.workflowNodes,
    workflowRun: input.workflowRun,
    nodeOutputs: input.runtime.nodeOutputs,
  });
  if (httpTerminal) {
    return httpTerminal;
  }

  const fillText = input.runtime.fillText.trim();
  if (fillText.length > 0) {
    if (input.runtime.dslOutcome === 'failed') {
      return dslDispatchFailedCompletion(fillText);
    }
    return {
      kind: 'text',
      fillText,
      dslOutcome: input.runtime.dslOutcome,
    };
  }

  if (input.workflowRun.status !== 'completed') {
    return {
      kind: 'failed',
      errorCode: 'WORKFLOW_INCOMPLETE',
      errorMessage: 'Workflow did not complete successfully',
    };
  }

  const lastDef = input.workflowNodes[input.workflowNodes.length - 1];
  if (!lastDef) {
    return { kind: 'workflow_done' };
  }

  if (TEXT_TERMINAL_ACTIONS.has(lastDef.action)) {
    return {
      kind: 'failed',
      errorCode: 'STREAM_EMPTY',
      errorMessage: 'Expected text output but none was produced',
    };
  }

  return { kind: 'workflow_done' };
}
