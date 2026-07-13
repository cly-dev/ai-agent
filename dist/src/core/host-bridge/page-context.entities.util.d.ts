import type { AgentChatPageContext } from './page-context.types';
export declare function coalescePageContext(...sources: Array<AgentChatPageContext | null | undefined>): AgentChatPageContext | null;
export declare function resolveEffectivePageContext(incoming: AgentChatPageContext | null | undefined, stored: AgentChatPageContext | null | undefined): AgentChatPageContext | null;
