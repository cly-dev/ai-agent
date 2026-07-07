import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
import type { PageWorkflowToolBundle } from './page-workflow-tool-bundle.util';
import type { ApprovalGateService } from '../approval/approval-gate.service';
import { type PageWorkflowRunnerInput, type PageWorkflowRunnerResult } from './page-workflow-runtime.util';
import type { ApprovalTriggerBinding } from '../approval/resolve-approval-parties.util';
import type { WorkflowRunState } from '../workflow/workflow.types';
export type PageWorkflowOrchestratorInput = PageWorkflowRunnerInput & {
    allowedToolIds: number[];
    toolBundle?: PageWorkflowToolBundle | null;
    approvalGate?: ApprovalGateService;
    approvalTriggerBinding?: ApprovalTriggerBinding | null;
    resumeFrom?: {
        workflowRun: WorkflowRunState;
        nodeOutputs: Record<string, unknown>;
        pendingWrite?: ApprovalPendingWrite | null;
        advancePastAwait?: boolean;
    };
    existingApprovalRequestId?: number | null;
    retryInstruction?: string | null;
    pageActionKey?: string | null;
};
export type PageWorkflowOrchestratorResult = PageWorkflowRunnerResult & {
    suspended?: boolean;
    approvalRequestId?: number;
};
export declare function orchestratePageWorkflow(input: PageWorkflowOrchestratorInput): Promise<PageWorkflowOrchestratorResult>;
