import type { Prisma } from '../../../generated/prisma/client';
export declare const SESSION_DETAIL_INCLUDE: {
    user: {
        select: {
            id: true;
            username: true;
        };
    };
    appClient: {
        select: {
            id: true;
            name: true;
            isActive: true;
        };
    };
    _count: {
        select: {
            messages: true;
            agentRuns: true;
            messageTurns: true;
        };
    };
};
export type SessionDetailRow = Prisma.SessionGetPayload<{
    include: typeof SESSION_DETAIL_INCLUDE;
}>;
export type SessionResponse = SessionDetailRow;
