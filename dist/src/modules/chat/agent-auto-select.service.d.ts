import { PrismaService } from '../../prisma/prisma.service';
import type { AgentChatPageContext } from '../../core/host-bridge';
export type AgentAutoSelectSource = 'requested' | 'session' | 'auto' | 'default' | 'fallback';
export type AgentAutoSelectInput = {
    appClientId: number;
    userId: number;
    userMessage: string;
    pageContext?: AgentChatPageContext | null;
    requestedAgentId?: number;
    sessionAgentId?: number | null;
};
export type AgentAutoSelectResult = {
    agentId: number;
    source: AgentAutoSelectSource;
    confidence?: number;
    reason: string;
};
export declare class AgentAutoSelectService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    select(input: AgentAutoSelectInput): Promise<AgentAutoSelectResult>;
    private loadCandidates;
    private scoreCandidates;
    private resolveUserRoleToolContext;
    private assertAgentBelongsToApp;
    private assertAppClientExists;
}
