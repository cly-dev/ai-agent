import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PrismaService } from '../../prisma/prisma.service';
import { stepsForRunPersistence } from '../agent-engine/engine/main/run/agent-run-audit.util';

export type ChatApprovalResumeChannel = 'session_confirm' | 'inbox_confirm';
export type ChatApprovalRejectChannel = 'session_cancel' | 'inbox_reject';

export type ChatApprovalAwaitingGateOutput = Record<string, unknown> & {
  status: 'awaiting_user';
  auditPhase: 'awaiting_approval';
  approvalRequestId: number;
  nodeId: string;
};

export type ChatApprovalConfirmedGateOutput = Record<string, unknown> & {
  status: 'approved';
  auditPhase: 'approval_confirmed';
  approvalRequestId: number;
  primaryRunId: number;
  resumeChannel: ChatApprovalResumeChannel;
  decidedByUserId: number;
  nodeId?: string | null;
};

export type ChatApprovalRejectedGateOutput = Record<string, unknown> & {
  status: 'rejected';
  auditPhase: 'approval_rejected';
  approvalRequestId: number;
  primaryRunId: number;
  rejectChannel: ChatApprovalRejectChannel;
  decidedByUserId: number;
  decisionNote?: string | null;
};

export type ChatApprovalResumeAudit = {
  approvalRequestId: number;
  resumeChannel: ChatApprovalResumeChannel;
  decidedByUserId: number;
  nodeId?: string | null;
};

export function offsetRunSteps(
  steps: AgentRunStep[],
  startStep: number,
): AgentRunStep[] {
  return steps.map((step, index) => ({
    ...step,
    step: startStep + index,
  }));
}

export async function resolveChatApprovalResumeAudit(input: {
  approvalRequests: {
    findChatBySessionPrimaryRun(input: {
      appClientId: number;
      sessionId: string;
      runId: number;
    }): Promise<{ id: number; nodeId: string } | null>;
  };
  appClientId: number;
  sessionId: string;
  primaryRunId: number;
  decidedByUserId: number;
  resumeChannel: ChatApprovalResumeChannel;
  approvalRequestId?: number;
  nodeId?: string | null;
}): Promise<ChatApprovalResumeAudit | null> {
  const row =
    input.approvalRequestId != null
      ? { id: input.approvalRequestId, nodeId: input.nodeId ?? '' }
      : await input.approvalRequests.findChatBySessionPrimaryRun({
          appClientId: input.appClientId,
          sessionId: input.sessionId,
          runId: input.primaryRunId,
        });
  if (!row?.id) {
    return null;
  }
  return {
    approvalRequestId: row.id,
    resumeChannel: input.resumeChannel,
    decidedByUserId: input.decidedByUserId,
    nodeId: input.nodeId ?? row.nodeId ?? null,
  };
}

export function enrichChatApprovalAwaitingGateOutput(
  output: Record<string, unknown>,
  input: { approvalRequestId: number; nodeId: string },
): ChatApprovalAwaitingGateOutput {
  return {
    ...output,
    status: 'awaiting_user',
    auditPhase: 'awaiting_approval',
    approvalRequestId: input.approvalRequestId,
    nodeId: input.nodeId,
  };
}

export function buildChatApprovalConfirmedRunStep(
  stepNumber: number,
  input: {
    approvalRequestId: number;
    primaryRunId: number;
    resumeChannel: ChatApprovalResumeChannel;
    decidedByUserId: number;
    nodeId?: string | null;
  },
): AgentRunStep {
  const output: ChatApprovalConfirmedGateOutput = {
    status: 'approved',
    auditPhase: 'approval_confirmed',
    approvalRequestId: input.approvalRequestId,
    primaryRunId: input.primaryRunId,
    resumeChannel: input.resumeChannel,
    decidedByUserId: input.decidedByUserId,
    nodeId: input.nodeId ?? null,
  };
  return {
    step: stepNumber,
    type: 'write_confirmation_gate',
    output,
  };
}

export function buildChatApprovalRejectedRunStep(
  stepNumber: number,
  input: {
    approvalRequestId: number;
    primaryRunId: number;
    rejectChannel: ChatApprovalRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
  },
): AgentRunStep {
  const output: ChatApprovalRejectedGateOutput = {
    status: 'rejected',
    auditPhase: 'approval_rejected',
    approvalRequestId: input.approvalRequestId,
    primaryRunId: input.primaryRunId,
    rejectChannel: input.rejectChannel,
    decidedByUserId: input.decidedByUserId,
    decisionNote: input.decisionNote ?? null,
  };
  return {
    step: stepNumber,
    type: 'write_confirmation_gate',
    output,
  };
}

/** 拒绝/取消：在 primary run 追加审计步（不覆盖历史 steps）。 */
export async function appendChatApprovalRejectedAuditToPrimaryRun(input: {
  prisma: PrismaService;
  primaryRunId: number;
  approvalRequestId: number;
  rejectChannel: ChatApprovalRejectChannel;
  decidedByUserId: number;
  decisionNote?: string | null;
}): Promise<void> {
  const row = await input.prisma.agentRun.findUnique({
    where: { id: input.primaryRunId },
    select: { steps: true },
  });
  if (!row) {
    return;
  }
  const priorSteps = parseAgentRunSteps(row.steps);
  const auditStep = buildChatApprovalRejectedRunStep(
    priorSteps.length > 0
      ? Math.max(...priorSteps.map((step) => step.step)) + 1
      : 1,
    {
      approvalRequestId: input.approvalRequestId,
      primaryRunId: input.primaryRunId,
      rejectChannel: input.rejectChannel,
      decidedByUserId: input.decidedByUserId,
      decisionNote: input.decisionNote,
    },
  );
  const nextSteps = stepsForRunPersistence([...priorSteps, auditStep]);
  await input.prisma.agentRun.update({
    where: { id: input.primaryRunId },
    data: { steps: nextSteps as object },
  });
}

function parseAgentRunSteps(raw: unknown): AgentRunStep[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (row): row is AgentRunStep =>
      typeof row === 'object' &&
      row != null &&
      typeof (row as AgentRunStep).step === 'number' &&
      typeof (row as AgentRunStep).type === 'string',
  );
}
