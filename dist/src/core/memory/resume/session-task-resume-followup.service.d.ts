import { z } from 'zod';
import { LlmService } from '../../llm/llm.service';
import { PromptRegistryService } from '../../prompt/prompt-registry.service';
import { type SessionGoaPayload } from '../goa/session-goa.types';
export declare const taskResumeFollowUpSchema: z.ZodObject<{
    continueActiveTask: z.ZodBoolean;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type TaskResumeFollowUpDecision = z.infer<typeof taskResumeFollowUpSchema>;
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
