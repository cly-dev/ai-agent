import type { WorkflowIrDocument } from './workflow-ir.types';
export type WorkflowIrTopologyIssue = {
    path: string;
    code: string;
    message: string;
};
export declare function validateWorkflowIrTopology(ir: WorkflowIrDocument): WorkflowIrTopologyIssue[];
