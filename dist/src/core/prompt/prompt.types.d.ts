import type { LlmChatMessage } from '../llm/llm.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
export type PromptComposeInput = {
    userId: number;
    sessionId: string;
    latestUserMessage: string;
    agentSystemPrompt?: string | null;
    sessionScope?: {
        appClientId: number | null;
        agentId: number | null;
    };
    pageContext?: AgentChatPageContext | null;
};
export type PromptComposeOutput = {
    messages: LlmChatMessage[];
};
