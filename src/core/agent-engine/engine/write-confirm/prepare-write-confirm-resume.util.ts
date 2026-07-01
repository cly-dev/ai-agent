import type { PendingWriteConfirmationSnapshot } from '../../../../modules/chat/pending-write-confirmation.types';
import type { PendingWriteConfirmationStore } from '../../../../modules/chat/pending-write-confirmation.store';
import type { ApprovalRequestService } from '../../../approval/approval-request.service';
import type {
  ApprovalResumeSnapshot,
} from '../../../approval/approval-resume-snapshot.types';
import { isChatApprovalSnapshot } from '../../../approval/approval-resume-snapshot.types';
import type { AgentRunSseGateway } from '../../../session-run/agent-run-sse.gateway';
import type { AgentService } from '../../../../modules/agent/agent.service';
import type { PrismaService } from '../../../../prisma/prisma.service';
import { isWorkflowAwaitUserConfirmResume } from '../../../workflow/workflow-mutation-write-gate.util';
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

export type PrepareWriteConfirmFromApprovalSnapshotInput = {
  resumeInput: ResumeAfterWriteConfirmInput;
  snapshot: ApprovalResumeSnapshot;
  prisma: PrismaService;
  agentService: AgentService;
};

function buildToolCallsFromApprovalSnapshot(
  snapshot: ApprovalResumeSnapshot,
): PendingWriteConfirmationSnapshot['toolCalls'] {
  const workflowRun =
    isChatApprovalSnapshot(snapshot)
      ? snapshot.channel.resume.workflowRun ?? snapshot.workflowRun
      : snapshot.workflowRun;

  if (
    isWorkflowAwaitUserConfirmResume({
      pendingToolCalls: [],
      workflowRun,
    })
  ) {
    return [];
  }

  return [
    {
      name: snapshot.pendingWrite.name,
      arguments: snapshot.pendingWrite.arguments,
      riskLevel: snapshot.pendingWrite.riskLevel,
      reason: '',
    },
  ];
}

/** 从 ApprovalRequest.resumeSnapshot 构建续跑上下文，不依赖 Redis gate。 */
export async function prepareWriteConfirmFromApprovalSnapshot(
  input: PrepareWriteConfirmFromApprovalSnapshotInput,
): Promise<WriteConfirmResumePrepared | null> {
  if (!isChatApprovalSnapshot(input.snapshot)) {
    return null;
  }

  const channel = input.snapshot.channel;
  const session = await input.prisma.session.findFirst({
    where: { id: channel.sessionId, userId: input.resumeInput.userId },
    select: { id: true, agentId: true, appClientId: true },
  });
  if (!session?.agentId) {
    return null;
  }

  const primaryRun = await input.prisma.agentRun.findFirst({
    where: {
      id: channel.runId,
      sessionId: channel.sessionId,
      userId: input.resumeInput.userId,
    },
    select: { id: true, turnId: true, input: true },
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

  const resumeContext = {
    ...channel.resume,
    workflowRun: channel.resume.workflowRun ?? input.snapshot.workflowRun,
    workflowNodeDefs:
      channel.resume.workflowNodeDefs ?? input.snapshot.workflowNodeDefs,
    workflowNodeOutputs:
      channel.resume.workflowNodeOutputs ?? input.snapshot.workflowNodeOutputs,
    pageContext:
      channel.resume.pageContext ?? input.snapshot.pageContext ?? null,
  };

  const consumed: PendingWriteConfirmationSnapshot = {
    runId: channel.runId,
    turnId: channel.turnId,
    sessionId: channel.sessionId,
    userId: input.resumeInput.userId,
    appClientId: session.appClientId,
    agentId: session.agentId,
    latestUserMessage: primaryRun.input ?? '',
    toolCalls: buildToolCallsFromApprovalSnapshot(input.snapshot),
    resumeContext,
    createdAt: new Date().toISOString(),
  };

  return {
    session: {
      id: session.id,
      agentId: session.agentId,
      appClientId: session.appClientId,
    },
    consumed,
    primaryRun: { id: primaryRun.id, turnId: primaryRun.turnId },
    suspendedPrimaryRunId: channel.runId,
  };
}

export type ReleaseWriteConfirmGateInput = {
  sessionId: string;
  userId: number;
  runId: number;
  appClientId: number;
  pendingWriteConfirmationStore: PendingWriteConfirmationStore;
  runSse: AgentRunSseGateway;
  approvalRequests: ApprovalRequestService;
  /** 收件箱已 CAS approve 时为 true，跳过 syncChatRealtimeDecision。 */
  skipChatApprovalSync?: boolean;
};

/** 清理 Redis gate 与 SSE 挂起态；实时 confirm 时同步 ApprovalRequest。 */
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
  if (input.skipChatApprovalSync) {
    return;
  }
  void input.approvalRequests
    .syncChatRealtimeDecision({
      appClientId: input.appClientId,
      sessionId: input.sessionId,
      runId: input.runId,
      decidedByUserId: input.userId,
      decision: 'approved',
    })
    .catch(() => undefined);
}
