import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import type { TurnRouteDraft, TurnRouteLlmInput } from './turn-routing.types';
export declare function resolveTurnRoute(input: {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    routeInput: TurnRouteLlmInput;
}): Promise<TurnRouteDraft>;
