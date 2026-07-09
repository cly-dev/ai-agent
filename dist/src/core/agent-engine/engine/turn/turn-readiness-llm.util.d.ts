import { z } from 'zod';
import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import type { TurnRespondMissingField } from './turn-respond.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
declare const readinessSlotSchema: z.ZodObject<{
    ready: z.ZodBoolean;
    missingFields: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        hint: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export type ReadinessSlotLlmResult = z.infer<typeof readinessSlotSchema>;
export declare function evaluateReadinessSlotsWithLlm(input: {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    userMessage: string;
    planGoal?: string | null;
    currentObjective?: string | null;
    requiredFields: string[];
    sessionObservationSummary?: string | null;
    pageContext?: AgentChatPageContext | null;
}): Promise<ReadinessSlotLlmResult>;
export declare function normalizeMissingFieldsFromLlm(rows: TurnRespondMissingField[] | undefined): TurnRespondMissingField[];
export {};
