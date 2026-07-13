import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';
export type SkillWorkflowBindingInput = {
    nodes: WorkflowNodeDef[];
    workflowToolIds: number[];
    workflowHostToolIds: number[];
    skillToolIds: number[];
    skillHostToolIds: number[];
};
export declare function validateSkillWorkflowBinding(input: SkillWorkflowBindingInput): WorkflowValidationIssue[];
export declare function isValidSkillWorkflowBinding(input: SkillWorkflowBindingInput): boolean;
