import type { Message } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionContextStore } from './session-context.store';
import { type SessionContextTurn } from './session-context.types';
export declare class SessionMessageContextSyncService {
    private readonly prisma;
    private readonly sessionContextStore;
    private readonly logger;
    constructor(prisma: PrismaService, sessionContextStore: SessionContextStore);
    messageToTurn(message: Message): SessionContextTurn;
    syncAfterMessageContentUpdate(sessionId: string, message: Message): Promise<void>;
    syncAfterMessageCreate(sessionId: string, message: Message): Promise<void>;
    rebuildFromDb(sessionId: string): Promise<void>;
}
