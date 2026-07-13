import type { LlmChatMessage } from '../llm/llm.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
export declare function buildPageActionUserContent(input: {
    instruction?: string | null;
    context?: Record<string, unknown> | null;
    pageContext?: AgentChatPageContext | null;
}): string;
export declare function buildPageActionLlmMessages(input: {
    systemPrompt: string;
    instruction?: string | null;
    context?: Record<string, unknown> | null;
    pageContext?: AgentChatPageContext | null;
}): LlmChatMessage[];
