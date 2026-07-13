import type { LlmService } from '../../../../llm/llm.service';
import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
export declare function buildPlanDraftSummarizeUserContent(input: {
    userMessage: string;
    planContext: string | null;
    toolSchemaJson: string;
    writeToolNames: string[];
    writeToolDescriptions: string;
    toolName: string;
    toolDescription?: string;
    fieldLabelText?: string;
    splitObservationsText: string | null;
    serializedOutput: string;
    composedWritePayload?: PlanComposeWriteObservationOutput | null;
}): string;
export declare function renderPlanDraftProseSupplementSystemPrompt(input: {
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
}): Promise<string>;
export declare function renderPlanPresentFromComposeSystemPrompt(input: {
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
}): Promise<string>;
export declare function invokePlanDraftProseSupplement(input: {
    llmService: LlmService;
    agentPrompts: LlmChatMessage[];
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    userContext: string;
    logWarn?: (message: string) => void;
}): Promise<string>;
