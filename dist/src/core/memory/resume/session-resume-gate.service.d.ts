import type { TurnExecutionContract } from '../../agent-engine/engine/turn/turn-execution-contract.types';
import { SessionGoaService } from '../goa/session-goa.service';
import { SessionTaskResumeFollowUpService } from './session-task-resume-followup.service';
import { type SessionGoaPayload, type StoredTaskPlan } from '../goa/session-goa.types';
import type { WorkflowRunState } from '../../workflow/workflow.types';
export type SessionResumeDecision = {
    action: 'resume';
    plan: StoredTaskPlan;
    followUpReason: string | null;
    resumedFromRunId: number | null;
    workflowRun?: WorkflowRunState | null;
} | {
    action: 'fresh';
} | {
    action: 'abandon_and_fresh';
};
export declare class SessionResumeGateService {
    private readonly goaService;
    private readonly taskResumeFollowUp;
    constructor(goaService: SessionGoaService, taskResumeFollowUp: SessionTaskResumeFollowUpService);
    evaluate(input: {
        sessionId: string;
        appClientId: number;
        agentId: number;
        latestUserMessage: string;
        goa: SessionGoaPayload;
        contract: TurnExecutionContract;
    }): Promise<SessionResumeDecision>;
}
