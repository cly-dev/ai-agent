import { SessionHistoryCompressionService } from '../memory/context/session-history-compression.service';
import { UserMemoryStore } from '../memory/user/user-memory.store';
import { SessionGoaService } from '../memory/goa/session-goa.service';
import { SessionContextStore } from '../memory/context/session-context.store';
import { PrismaService } from '../../prisma/prisma.service';
import { PromptRegistryService } from './prompt-registry.service';
import type { PromptComposeInput, PromptComposeOutput } from './prompt.types';
export declare class PromptComposerService {
    private readonly prisma;
    private readonly userMemoryStore;
    private readonly sessionGoa;
    private readonly sessionHistoryCompression;
    private readonly sessionContextStore;
    private readonly promptRegistry;
    private readonly logger;
    private static readonly MAX_SESSION_MESSAGES;
    constructor(prisma: PrismaService, userMemoryStore: UserMemoryStore, sessionGoa: SessionGoaService, sessionHistoryCompression: SessionHistoryCompressionService, sessionContextStore: SessionContextStore, promptRegistry: PromptRegistryService);
    compose(input: PromptComposeInput): Promise<PromptComposeOutput>;
    warmSessionContext(sessionId: string): Promise<boolean>;
    private loadRecentConversationMessages;
    private cacheSessionPayload;
    private loadFromRedis;
    private loadFromDatabase;
    private loadSessionScope;
    private loadAgentPrompt;
    private composeAgentPrompt;
}
