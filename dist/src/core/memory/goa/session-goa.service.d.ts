import type { LlmChatMessage } from '../../llm/llm.types';
import { type AgentChatPageContext } from '../../host-bridge';
import { SessionGoaStore } from './session-goa.store';
import { type SessionGoaPayload, type SessionMemoryUpdateContext, type StoredTaskPlan, type TurnEpisode } from './session-goa.types';
export declare class SessionGoaService {
    private readonly goaStore;
    private readonly logger;
    constructor(goaStore: SessionGoaStore);
    getPayload(sessionId: string): Promise<SessionGoaPayload>;
    ensurePayload(sessionId: string): Promise<SessionGoaPayload>;
    refreshFromAgentRun(sessionId: string, ctx: SessionMemoryUpdateContext): Promise<void>;
    appendFromAgentRun(sessionId: string, ctx: SessionMemoryUpdateContext): Promise<{
        episode: TurnEpisode;
    } | null>;
    private buildMergedPayload;
    buildPromptMessages(payload: SessionGoaPayload): LlmChatMessage[];
    buildPromptMessagesForSession(sessionId: string): Promise<LlmChatMessage[]>;
    shouldResumeTaskPlan(payload: SessionGoaPayload, intentKind: 'task' | 'smalltalk' | 'unclear'): payload is SessionGoaPayload & {
        activeTask: NonNullable<SessionGoaPayload['activeTask']>;
    };
    buildPriorToolObservationsForGraph(payload: SessionGoaPayload | null): Array<{
        name: string;
        output: unknown;
    }>;
    syncHostPageContext(sessionId: string, incoming: AgentChatPageContext | null | undefined): Promise<AgentChatPageContext | null>;
    abandonActiveTask(sessionId: string): Promise<void>;
    getStoredPlan(payload: SessionGoaPayload): StoredTaskPlan | null;
}
