import { isWorkflowDebugEnabled, isWorkflowFileDebugEnabled } from '../../security/file-debug-log.util';
import type { WorkflowRunState } from '../workflow.types';
export type WorkflowDebugRecord = {
    component: 'workflow';
    stage: string;
    writtenAt: string;
} & Record<string, unknown>;
export declare function logWorkflowDebug(stage: string, payload: Record<string, unknown> & {
    workflowRun?: WorkflowRunState | null;
}): string | null;
export declare function logWorkflowGraphBoot(input: {
    runId: number;
    sessionId: string;
}): string | null;
export { isWorkflowDebugEnabled, isWorkflowFileDebugEnabled };
