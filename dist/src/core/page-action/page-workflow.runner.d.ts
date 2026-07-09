import type { ApprovalGateService } from '../approval/approval-gate.service';
import { type PageWorkflowOrchestratorResult } from './page-workflow-orchestrator';
import type { PageWorkflowRunnerInput, PageWorkflowRunnerResult } from './page-workflow-runtime.util';
export type { PageWorkflowRunnerInput, PageWorkflowRunnerResult };
export declare function runPageWorkflow(input: PageWorkflowRunnerInput & {
    allowedToolIds?: number[];
    approvalGate?: ApprovalGateService;
}): Promise<PageWorkflowRunnerResult>;
export type { PageWorkflowOrchestratorResult };
