import type { HarnessRunner } from '../harness/harness-runner';
import type { HarnessSensorResult } from '../harness/harness.types';
import { harnessTraceToAgentStepOutput } from '../harness/trace/harness-trace.util';
import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowExecutorOutcome } from '../workflow/executors/workflow-executor.types';
import type { WorkflowSummarizeMode } from '../workflow/workflow-node-input.types';
import type { WorkflowActionKind } from '../workflow/workflow.types';
import { buildWorkflowNodeOutputRef } from '../workflow/workflow-node-output.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';

export { buildWorkflowNodeOutputRef as buildPageWorkflowOutputRef };

export async function runPageWorkflowHarnessSensors(input: {
  harness: HarnessRunner;
  nodeId: string;
  action: WorkflowActionKind;
  payload: unknown;
  recorder: PageActionRunStepRecorder;
}): Promise<HarnessSensorResult | undefined> {
  const sensorRun = await input.harness.runAfterNodeSensors({
    ctx: { nodeId: input.nodeId, action: input.action, profile: 'page' },
    payload: input.payload,
  });
  if (sensorRun.trace.length > 0) {
    input.recorder.record({
      type: 'harness',
      name: `${input.nodeId}:sensors`,
      detail: harnessTraceToAgentStepOutput(sensorRun.trace),
      status: sensorRun.sensorFailed ? 'failed' : 'ok',
    });
  }
  return sensorRun.sensorFailed;
}

export function mergePageWorkflowLlmMetrics(
  current: {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
  },
  next: {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
  },
): void {
  if (next.model) {
    current.model = next.model;
  }
  if (next.promptTokens != null) {
    current.promptTokens = (current.promptTokens ?? 0) + next.promptTokens;
  }
  if (next.completionTokens != null) {
    current.completionTokens =
      (current.completionTokens ?? 0) + next.completionTokens;
  }
}

export function applySummarizeFillText(input: {
  fillText: string;
  summaryText: string;
  mode: WorkflowSummarizeMode;
}): string {
  if (input.mode === 'draft' || input.fillText.trim()) {
    return input.fillText;
  }
  const summaryText = input.summaryText.trim();
  return summaryText.length > 0 ? summaryText : input.fillText;
}

export function buildPageHarnessSensorPayload(
  action: WorkflowActionKind,
  outcome: Extract<WorkflowExecutorOutcome, { kind: 'completed' }>,
): unknown {
  const nodeOutput = outcome.nodeOutput;
  switch (action) {
    case 'generate_and_push':
      return nodeOutput ?? {};
    case 'fetch_data': {
      const row = (nodeOutput ?? {}) as {
        toolName?: string;
        toolId?: number;
        output?: unknown;
        agentMetadata?: unknown;
      };
      return {
        observations: [
          { name: row.toolName ?? 'tool', output: row.output },
        ],
        toolName: row.toolName,
        toolId: row.toolId,
        agentMetadata: row.agentMetadata ?? null,
      };
    }
    case 'summarize':
    case 'present_mutation': {
      const row = (nodeOutput ?? {}) as {
        summaryText?: string;
        mode?: WorkflowSummarizeMode | 'brief' | 'detailed';
      };
      return {
        summaryText: row.summaryText ?? '',
        mode: row.mode ?? (action === 'present_mutation' ? 'brief' : 'final'),
      };
    }
    default:
      return {};
  }
}

export function applyPageWorkflowNodeOutput(
  runtime: PageWorkflowExecutorRuntime,
  outcome: Extract<WorkflowExecutorOutcome, { kind: 'completed' }>,
): void {
  if (outcome.outputRef != null && outcome.nodeOutput !== undefined) {
    runtime.nodeOutputs[outcome.outputRef] = outcome.nodeOutput;
  }
  if (
    outcome.nodeOutput &&
    typeof outcome.nodeOutput === 'object' &&
    !Array.isArray(outcome.nodeOutput)
  ) {
    const row = outcome.nodeOutput as Record<string, unknown>;
    if (typeof row.summaryText === 'string') {
      runtime.fillText = applySummarizeFillText({
        fillText: runtime.fillText,
        summaryText: row.summaryText,
        mode: (row.mode as WorkflowSummarizeMode | undefined) ?? 'final',
      });
    }
  }
}
