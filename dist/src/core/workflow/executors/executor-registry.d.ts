import type { WorkflowActionKind } from '../workflow.types';
import type { WorkflowExecutor } from './workflow-executor.types';
export declare function getWorkflowExecutor(action: WorkflowActionKind, profile?: 'chat' | 'page'): WorkflowExecutor | null;
export declare function listWorkflowExecutors(profile?: 'chat' | 'page'): WorkflowExecutor[];
