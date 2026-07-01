import type { ToolLevel } from '../../../generated/prisma/client';
import type { PendingWriteResumeContext } from '../../modules/chat/pending-write-confirmation.types';
import { resolveLatestPlanComposeWrite } from '../agent-engine/engine/main/plan-present/plan-compose-write.util';
import type { AgentEngineTool, ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import type { ApprovalGateService } from './approval-gate.service';
import type { ApprovalRequestService } from './approval-request.service';
import { resolveApprovalParties } from './resolve-approval-parties.util';

export async function mirrorChatApprovalRequest(input: {
  approvalGate: ApprovalGateService;
  approvalRequests: ApprovalRequestService;
  appClientId: number;
  userId: number;
  sessionId: string;
  runId: number;
  turnId: number;
  nodeId: string;
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowNodeOutputs: Record<string, unknown>;
  observations: ToolObservation[];
  scopedTools: AgentEngineTool[];
  pageContext: AgentChatPageContext | null;
  resumeContext: PendingWriteResumeContext;
}): Promise<number | null> {
  const idempotencyKey = `chat:${input.sessionId}:${input.runId}:${input.nodeId}`;
  const existing = await input.approvalRequests.findPendingByIdempotencyKey({
    appClientId: input.appClientId,
    idempotencyKey,
  });
  if (existing) {
    return existing.id;
  }

  const composed = resolveLatestPlanComposeWrite(input.observations);
  if (!composed) {
    return null;
  }

  const scopedTool = input.scopedTools.find((tool) => tool.name === composed.tool);
  const riskLevel = (scopedTool?.riskLevel ?? 'L2') as ToolLevel;

  const parties = resolveApprovalParties({
    source: 'chat',
    initiatorUserId: input.userId,
  });
  if (!parties.ok) {
    return null;
  }

  const nodeDef = input.workflowNodeDefs.find((row) => row.id === input.nodeId);
  const title = nodeDef?.name?.trim()
    ? `${nodeDef.name} · 写操作确认`
    : `写操作确认 · ${input.nodeId}`;

  const approval = await input.approvalGate.suspend({
    appClientId: input.appClientId,
    source: 'chat',
    initiatorUserId: parties.parties.initiatorUserId,
    approverUserId: parties.parties.approverUserId,
    workflowId: input.workflowRun.workflowId,
    workflowVersion: input.workflowRun.version,
    nodeId: input.nodeId,
    title,
    summary: null,
    workflowRun: input.workflowRun,
    workflowNodeDefs: input.workflowNodeDefs,
    workflowNodeOutputs: { ...input.workflowNodeOutputs },
    pendingWrite: input.approvalGate.buildPendingWriteFromTool({
      name: composed.tool,
      arguments: composed.arguments,
      riskLevel,
    }),
    scopedToolIds: input.scopedTools.map((tool) => tool.id),
    pageContext: input.pageContext,
    sessionId: input.sessionId,
    idempotencyKey,
    channel: {
      kind: 'chat',
      sessionId: input.sessionId,
      runId: input.runId,
      turnId: input.turnId,
      resume: input.resumeContext,
    },
  });

  return approval.id;
}
