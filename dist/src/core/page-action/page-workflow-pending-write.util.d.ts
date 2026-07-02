import type { ComposeMutationNodeInput } from '../workflow/workflow-node-input.types';
import type { WriteDataNodeInput } from '../workflow/workflow-node-input.types';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
export type PageWorkflowComposeOutput = {
    tool: string;
    toolId: number;
    arguments: Record<string, unknown>;
    riskLevel: string;
};
export declare function buildPageComposeNodeOutput(output: PageWorkflowComposeOutput): Record<string, unknown>;
export declare function resolvePageWorkflowPresentSummary(input: {
    nodes: WorkflowNodeDef[];
    nodeOutputs: Record<string, unknown>;
    fillText: string;
}): string | null;
export declare function resolvePageWorkflowPendingWrite(input: {
    nodes: WorkflowNodeDef[];
    nodeOutputs: Record<string, unknown>;
}): PageWorkflowComposeOutput | null;
export declare function readComposeMutationToolId(input: ComposeMutationNodeInput | undefined): number | null;
export declare function readWriteDataToolId(input: WriteDataNodeInput | undefined): number | null;
