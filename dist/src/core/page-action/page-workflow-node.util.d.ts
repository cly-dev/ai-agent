import type { HarnessRunner } from '../harness/harness-runner';
import type { HarnessSensorResult } from '../harness/harness.types';
import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowExecutorOutcome } from '../workflow/executors/workflow-executor.types';
import type { WorkflowSummarizeMode } from '../workflow/workflow-node-input.types';
import type { WorkflowActionKind } from '../workflow/workflow.types';
import { buildWorkflowNodeOutputRef } from '../workflow/workflow-node-output.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
export { buildWorkflowNodeOutputRef as buildPageWorkflowOutputRef };
export declare function runPageWorkflowHarnessSensors(input: {
    harness: HarnessRunner;
    nodeId: string;
    action: WorkflowActionKind;
    payload: unknown;
    recorder: PageActionRunStepRecorder;
}): Promise<HarnessSensorResult | undefined>;
export declare function mergePageWorkflowLlmMetrics(current: {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
}, next: {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
}): void;
export declare function applySummarizeFillText(input: {
    fillText: string;
    summaryText: string;
    mode: WorkflowSummarizeMode;
}): string;
export declare function buildPageHarnessSensorPayload(action: WorkflowActionKind, outcome: Extract<WorkflowExecutorOutcome, {
    kind: 'completed';
}>): unknown;
export declare function applyPageWorkflowNodeOutput(runtime: PageWorkflowExecutorRuntime, outcome: Extract<WorkflowExecutorOutcome, {
    kind: 'completed';
}>): void;
