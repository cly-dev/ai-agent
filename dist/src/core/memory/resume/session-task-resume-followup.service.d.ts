import { LlmService } from '../../llm/llm.service';
import { PromptRegistryService } from '../../prompt/prompt-registry.service';
import { type SessionGoaPayload } from '../goa/session-goa.types';
import { type TaskResumeFollowUpDecision } from './session-resume-followup.util';
export type { TaskResumeFollowUpDecision } from './session-resume-followup.util';
export { taskResumeFollowUpSchema, taskResumeFollowUpDecisionSchema, } from './session-resume-followup.util';
export declare class SessionTaskResumeFollowUpService {
    private readonly llmService;
    private readonly promptRegistry;
    private readonly logger;
    constructor(llmService: LlmService, promptRegistry: PromptRegistryService);
    classify(input: {
        sessionId: string;
        appClientId: number;
        agentId: number;
        latestUserMessage: string;
        goa: SessionGoaPayload;
    }): Promise<TaskResumeFollowUpDecision | null>;
}
