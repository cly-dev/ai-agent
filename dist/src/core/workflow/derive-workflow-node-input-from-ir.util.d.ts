import type { WorkflowIrNodeType } from './workflow-ir.types';
import type { WorkflowActionKind } from './workflow.types';
import type { AwaitUserConfirmNodeInput, ComposeMutationNodeInput, DetectCluesNodeInput, FetchDataNodeInput, GenerateAndPushNodeInput, PresentMutationNodeInput, SummarizeImagesNodeInput, SummarizeNodeInput, WriteDataNodeInput } from './workflow-node-input.types';
export declare function deriveWorkflowNodeInputFromIr(input: {
    irType: WorkflowIrNodeType;
    config: Record<string, unknown>;
    action: WorkflowActionKind;
}): FetchDataNodeInput | GenerateAndPushNodeInput | SummarizeNodeInput | DetectCluesNodeInput | WriteDataNodeInput | SummarizeImagesNodeInput | ComposeMutationNodeInput | PresentMutationNodeInput | AwaitUserConfirmNodeInput | null;
