import type { TurnExecutionContract } from '../../agent-engine/engine/turn/turn-execution-contract.types';
import { SessionGoaService } from '../goa/session-goa.service';
import { SessionTaskResumeFollowUpService } from './session-task-resume-followup.service';
import { type SessionGoaPayload } from '../goa/session-goa.types';
import { type SessionResumeDecision } from './session-resume-decision.types';
export type { PlanGoalStrategy, SessionResumeDecision, TaskResumeFollowUpKind, } from './session-resume-decision.types';
export { defaultFreshResumeDecision, goalStrategyFromResumeDecision, resumeDecisionKeepsActiveTask, } from './session-resume-decision.types';
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
