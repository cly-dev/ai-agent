import type { Prisma } from '../../../generated/prisma/client';
export declare const MESSAGE_TURN_DETAIL_INCLUDE: {
    agentRuns: {
        orderBy: {
            sequence: "asc";
        };
        include: {
            agent: {
                select: {
                    id: true;
                    name: true;
                };
            };
        };
    };
    message: {
        select: {
            id: true;
            role: true;
            content: true;
            createdAt: true;
        };
    };
    outputMessage: {
        select: {
            id: true;
            role: true;
            content: true;
            createdAt: true;
        };
    };
    primaryAgent: {
        select: {
            id: true;
            name: true;
        };
    };
    session: {
        select: {
            id: true;
            title: true;
        };
    };
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
        };
    };
};
export type MessageTurnDetailRow = Prisma.MessageTurnGetPayload<{
    include: typeof MESSAGE_TURN_DETAIL_INCLUDE;
}>;
export type ToolQualityCounts = {
    high: number;
    medium: number;
    low: number;
};
export type ToolMachineCodeCounts = {
    INTENT_RECALL_FAILED: number;
    TOOL_AUTH_FAILED: number;
    TOOL_TIMEOUT: number;
    TOOL_EMPTY_RESULT: number;
    LLM_TIMEOUT: number;
    LLM_RATE_LIMIT: number;
};
export type MessageTurnResponse = MessageTurnDetailRow & {
    toolsUsed: string[] | null;
    toolQualityCounts: ToolQualityCounts | null;
    toolMachineCodeCounts: ToolMachineCodeCounts | null;
};
