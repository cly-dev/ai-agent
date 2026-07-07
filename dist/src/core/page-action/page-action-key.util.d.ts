import type { AgentChatPageContext } from '../host-bridge/page-context.types';
export declare const PAGE_ACTION_ACTIVE_RUN_STATUSES: readonly ["running", "awaiting_approval"];
export type ComputePageActionKeyInput = {
    actionKey: string;
    pageContext: AgentChatPageContext | null;
    instruction?: string | null;
    context?: Record<string, unknown> | null;
};
export declare function computePageActionKey(input: ComputePageActionKeyInput): string;
