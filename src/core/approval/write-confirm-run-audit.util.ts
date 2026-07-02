import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PrismaService } from '../../prisma/prisma.service';
import { stepsForRunPersistence } from '../agent-engine/engine/main/run/agent-run-audit.util';
import {
  maxRunStepNumber,
  parseAgentRunSteps,
} from '../agent-engine/engine/main/run/agent-run-steps.util';

export type ChatWriteConfirmRejectChannel = 'session_cancel';

export type ChatWriteConfirmResumeAudit = {
  decidedByUserId: number;
  nodeId?: string | null;
};

export function buildChatWriteConfirmConfirmedRunStep(
  stepNumber: number,
  input: {
    primaryRunId: number;
    decidedByUserId: number;
    nodeId?: string | null;
  },
): AgentRunStep {
  return {
    step: stepNumber,
    type: 'write_confirmation_gate',
    output: {
      status: 'approved',
      auditPhase: 'approval_confirmed',
      primaryRunId: input.primaryRunId,
      resumeChannel: 'session_confirm',
      decidedByUserId: input.decidedByUserId,
      nodeId: input.nodeId ?? null,
    },
  };
}

export function buildChatWriteConfirmRejectedRunStep(
  stepNumber: number,
  input: {
    primaryRunId: number;
    rejectChannel: ChatWriteConfirmRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
  },
): AgentRunStep {
  return {
    step: stepNumber,
    type: 'write_confirmation_gate',
    output: {
      status: 'rejected',
      auditPhase: 'approval_rejected',
      primaryRunId: input.primaryRunId,
      rejectChannel: input.rejectChannel,
      decidedByUserId: input.decidedByUserId,
      decisionNote: input.decisionNote ?? null,
    },
  };
}

/** 拒绝/取消：在 primary run 追加审计步（不覆盖历史 steps）。 */
export async function appendChatWriteConfirmRejectedAuditToPrimaryRun(input: {
  prisma: PrismaService;
  primaryRunId: number;
  rejectChannel: ChatWriteConfirmRejectChannel;
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
  const auditStep = buildChatWriteConfirmRejectedRunStep(
    priorSteps.length > 0 ? maxRunStepNumber(priorSteps) + 1 : 1,
    {
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
