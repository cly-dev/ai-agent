import type { PendingWriteConfirmationStore } from '../../../../modules/chat/pending-write-confirmation.store';
import type { AgentRunSseGateway } from '../../../session-run/agent-run-sse.gateway';
import type { AgentService } from '../../../../modules/agent/agent.service';
import type { PrismaService } from '../../../../prisma/prisma.service';
import type { ResumeAfterWriteConfirmInput } from '../main/types/agent-engine.types';
import type { WriteConfirmResumePrepared } from './write-confirm-resume.types';

export type PrepareWriteConfirmFromRedisInput = {
  resumeInput: ResumeAfterWriteConfirmInput;
  prisma: PrismaService;
  agentService: AgentService;
  pendingWriteConfirmationStore: PendingWriteConfirmationStore;
  emitWriteConfirmationExpired(sessionId: string): void;
};

export async function prepareWriteConfirmFromRedis(
  input: PrepareWriteConfirmFromRedisInput,
): Promise<WriteConfirmResumePrepared | null> {
  const session = await input.prisma.session.findFirst({
    where: { id: input.resumeInput.sessionId, userId: input.resumeInput.userId },
    select: { id: true, agentId: true, appClientId: true },
  });
  if (!session?.agentId) {
    return null;
  }

  const pending = await input.pendingWriteConfirmationStore.get(
    input.resumeInput.sessionId,
    input.resumeInput.userId,
  );
  if (!pending) {
    return null;
  }

  const primaryRun = await input.prisma.agentRun.findFirst({
    where: {
      id: pending.runId,
      sessionId: pending.sessionId,
      userId: input.resumeInput.userId,
    },
    select: { id: true, turnId: true },
  });
  if (!primaryRun?.turnId) {
    return null;
  }

  const agent = await input.agentService.getRuntimeAgent(
    session.appClientId,
    session.agentId,
  );
  if (!agent) {
    return null;
  }

  return {
    session: {
      id: session.id,
      agentId: session.agentId,
      appClientId: session.appClientId,
    },
    consumed: pending,
    primaryRun,
    suspendedPrimaryRunId: pending.runId,
  };
}

export type ReleaseWriteConfirmGateInput = {
  sessionId: string;
  userId: number;
  runId: number;
  pendingWriteConfirmationStore: PendingWriteConfirmationStore;
  runSse: AgentRunSseGateway;
};

/** 清理 Redis gate 与 SSE 挂起态。 */
export async function releaseWriteConfirmGate(
  input: ReleaseWriteConfirmGateInput,
): Promise<void> {
  const pending = await input.pendingWriteConfirmationStore.get(
    input.sessionId,
    input.userId,
  );
  if (pending?.runId === input.runId) {
    await input.pendingWriteConfirmationStore.consume(
      input.sessionId,
      input.userId,
    );
  }
  input.runSse.purgeWriteConfirmationGate(input.sessionId, input.runId);
}
