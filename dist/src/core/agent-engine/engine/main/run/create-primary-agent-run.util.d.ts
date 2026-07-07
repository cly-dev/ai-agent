import { type AgentRun, type MessageTurn } from '../../../../../../generated/prisma/client';
import type { PrismaService } from '../../../../../prisma/prisma.service';
export type CreatePrimaryAgentRunInput = {
    messageId: number;
    sessionId: string;
    userId: number;
    appClientId: number;
    userInput: string;
    agentId: number;
    maxSteps: number;
    startedAt: Date;
};
export type CreatePrimaryAgentRunResult = {
    turn: MessageTurn;
    run: AgentRun;
};
export declare function createPrimaryAgentRunTurn(prisma: PrismaService, input: CreatePrimaryAgentRunInput): Promise<CreatePrimaryAgentRunResult>;
