import type { AgentChatPageContext } from '../../core/host-bridge';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import type { SessionPrepareResult } from './session-prepare.types';
import { SessionPrepareStore } from './session-prepare.store';
import { SessionRuntimeResolverService } from './session-runtime-resolver.service';
import type { PrepareChatDto } from './dto/prepare-chat.dto';
export declare class SessionPrepareService {
    private readonly prisma;
    private readonly agentService;
    private readonly promptComposer;
    private readonly sessionPrepareStore;
    private readonly sessionRuntimeResolver;
    private readonly hostToolCatalogService;
    private readonly logger;
    private static readonly SESSION_ID_HEX;
    constructor(prisma: PrismaService, agentService: AgentService, promptComposer: PromptComposerService, sessionPrepareStore: SessionPrepareStore, sessionRuntimeResolver: SessionRuntimeResolverService, hostToolCatalogService: AgentHostToolCatalogService);
    warmInBackground(sessionId: string, userId: number, appClientId: number, pageContext?: AgentChatPageContext | null): void;
    resolvePageContextFromPrepareDto(dto?: PrepareChatDto | null): AgentChatPageContext | null;
    warm(sessionId: string, userId: number, appClientId: number, pageContext?: AgentChatPageContext | null): Promise<SessionPrepareResult>;
    private normalizeSessionId;
}
