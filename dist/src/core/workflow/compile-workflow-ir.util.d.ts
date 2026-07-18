import type { WorkflowIntent } from './workflow-intent.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
export type CompiledWorkflowIr = WorkflowIrDocument & {
    stepEntryNodeId: Record<string, string>;
    stepExitNodeId: Record<string, string>;
};
export declare function compileWorkflowIr(intent: WorkflowIntent): CompiledWorkflowIr;
