import { LlmService } from '../../llm/llm.service';
import type { LlmChatMessage } from '../../llm/llm.types';
import { PromptRegistryService } from '../../prompt/prompt-registry.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionContextStore } from './session-context.store';
import { SessionGoaStore } from '../goa/session-goa.store';
import { type SessionContextPayload } from './session-context.types';
export declare class SessionHistoryCompressionService {
    private readonly sessionContextStore;
    private readonly goaStore;
    private readonly llmService;
    private readonly promptRegistry;
    private readonly prisma;
    private readonly logger;
    constructor(sessionContextStore: SessionContextStore, goaStore: SessionGoaStore, llmService: LlmService, promptRegistry: PromptRegistryService, prisma: PrismaService);
    maybeCompressAfterTurn(sessionId: string): Promise<void>;
    buildPromptHistory(payload: SessionContextPayload, maxMessages: number): LlmChatMessage[];
    private loadSessionPromptScope;
    private synthesizeHistorySummary;
    private formatTurnsForCompression;
    private trimTranscriptToTokenBudget;
}
