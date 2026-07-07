import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { ToolObservation } from '../types/agent-engine.types';
export declare function buildPlanReasonHostFillUserContent(input: {
    userMessage: string;
    planContext: string | null;
    pageContext?: AgentChatPageContext | null;
    hostTools: HostToolDecisionDefinition[];
    splitObservationsText: string | null;
    serializedOutput: string;
}): string;
export declare function buildPlanReasonHostMachineStreamMessages(input: {
    agentPrompts: LlmChatMessage[];
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    userContext: string;
}): Promise<LlmChatMessage[]>;
export declare function resolveReasonHostFillObservationPayload(input: {
    mergedObservation: ToolObservation;
    toolObservations: ToolObservation[];
}): {
    splitObservationsText: string | null;
    serializedOutput: string;
};
