import type { WorkflowIntent } from './workflow-intent.types';
export type WorkflowIntentValidationIssue = {
    path: string;
    code: string;
    message: string;
};
export declare function validateWorkflowIntent(intent: WorkflowIntent): WorkflowIntentValidationIssue[];
export declare function parseWorkflowIntentJson(value: unknown): WorkflowIntent | null;
