import type { HostActionHostToolInvocation } from './host-action.types';
import type { HostActionEventPublisher } from './host-action-dispatch.util';
import type { HostActionSsePayload } from './host-action.types';
import type { AgentChatPageContext } from './page-context.types';
export type DispatchHostActionInstantInput = {
    pageContext?: AgentChatPageContext | null;
    runId: number;
    turnId: number;
    hostTools: HostActionHostToolInvocation[];
    planStepId?: string | null;
    reason?: string;
    streamId?: string;
    generation?: number;
};
export declare function dispatchHostActionInstant(publish: HostActionEventPublisher, sessionId: string, input: DispatchHostActionInstantInput): HostActionSsePayload | null;
