import {
  AgentRunRole,
  AgentRunStatus,
  type AgentRun,
  type MessageTurn,
} from '../../../../../../generated/prisma/client';
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

/** 单事务创建 messageTurn + primary agentRun，减少 Chat run 启动的 DB 往返。 */
export async function createPrimaryAgentRunTurn(
  prisma: PrismaService,
  input: CreatePrimaryAgentRunInput,
): Promise<CreatePrimaryAgentRunResult> {
  return prisma.$transaction(async (tx) => {
    const turn = await tx.messageTurn.create({
      data: {
        messageId: input.messageId,
        sessionId: input.sessionId,
        userId: input.userId,
        appClientId: input.appClientId,
        userInput: input.userInput,
        primaryAgentId: input.agentId,
        agentRunCount: 1,
        status: AgentRunStatus.running,
        startedAt: input.startedAt,
      },
    });
    const run = await tx.agentRun.create({
      data: {
        turnId: turn.id,
        agentId: input.agentId,
        appClientId: input.appClientId,
        sessionId: input.sessionId,
        userId: input.userId,
        role: AgentRunRole.primary,
        sequence: 1,
        input: input.userInput,
        status: AgentRunStatus.running,
        steps: [],
        currentStep: 0,
        maxSteps: input.maxSteps,
        startedAt: input.startedAt,
      },
    });
    return { turn, run };
  });
}
