import type { Message } from '../../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SessionMessageContextSyncService } from '../../../../memory/context/session-message-context-sync.service';
import { RunAssistantArtifactStore } from './run-assistant-artifact.store';
type PrismaTx = Prisma.TransactionClient;
export declare class RunAssistantMessagePersistService {
    private readonly prisma;
    private readonly assistantArtifact;
    private readonly sessionMessageContext;
    constructor(prisma: PrismaService, assistantArtifact: RunAssistantArtifactStore, sessionMessageContext: SessionMessageContextSyncService);
    persistFromArtifactInTx(tx: PrismaTx, input: {
        userId: number;
        sessionId: string;
        runId: number;
        turnId: number;
    }): Promise<{
        message: Message | null;
        replacedTurnOutput: boolean;
    }>;
    appendNoticeToTurnOutput(input: {
        userId: number;
        sessionId: string;
        turnId: number;
        noticeMarkdown: string;
    }): Promise<Message | null>;
    syncPersistedMessage(sessionId: string, message: Message, options?: {
        replacedTurnOutput?: boolean;
    }): Promise<void>;
}
export {};
