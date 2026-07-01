import type { ApprovalGateService } from '../approval/approval-gate.service';
import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
import { type PageWorkflowRunnerInput, type PageWorkflowRunnerResult } from './page-workflow-runtime.util';
import type { ApprovalTriggerBinding } from '../approval/resolve-approval-parties.util';
import type { WorkflowRunState } from '../workflow/workflow.types';
export type PageWorkflowOrchestratorInput = PageWorkflowRunnerInput & {
    allowedToolIds: number[];
    approvalGate?: ApprovalGateService;
    approvalTriggerBinding?: ApprovalTriggerBinding | null;
    resumeFrom?: {
        workflowRun: WorkflowRunState;
        nodeOutputs: Record<string, unknown>;
        pendingWrite: ApprovalPendingWrite;
        advancePastAwait?: boolean;
    };
};
export type PageWorkflowOrchestratorResult = PageWorkflowRunnerResult & {
    suspended?: boolean;
    approvalRequestId?: number;
};
export declare function orchestratePageWorkflow(input: PageWorkflowOrchestratorInput): Promise<PageWorkflowOrchestratorResult>;
