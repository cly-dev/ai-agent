import { PrismaService } from '../../../prisma/prisma.service';
import { type SessionGoaPayload } from './session-goa.types';
export declare class SessionGoaReplayService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    replay(sessionId: string): Promise<SessionGoaPayload | null>;
}
