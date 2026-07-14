import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
export type PageWorkflowComposeMutationResult = {
    arguments: Record<string, unknown>;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
};
export declare function executePageWorkflowComposeMutation(input: {
    runtime: PageWorkflowExecutorRuntime;
    def: WorkflowNodeDef;
    writeToolId: number;
    allowedToolIds: number[];
    stepRecorder?: PageActionRunStepRecorder;
}): Promise<PageWorkflowComposeMutationResult>;
