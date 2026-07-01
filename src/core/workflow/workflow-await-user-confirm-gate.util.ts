import { AgentRunStatus } from '../../../generated/prisma/client';
import type { PendingWriteResumeContext } from '../../modules/chat/pending-write-confirmation.types';
import { serializeObservationsForPending } from '../agent-engine/engine/agent-write-confirmation.util';
import { emitAgentMessageSseDebug } from '../agent-engine/engine/message/message-blocks-debug.util';
import {
  buildMutationPreviewUnavailableUserMessage,
  hasUserVisibleMutationPreview,
} from '../agent-engine/engine/mutation-preview-before-gate.util';
import { buildWriteConfirmationUserMessage } from '../agent-engine/engine/write-confirmation-gate.util';
import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { nextRunStepNumber } from '../agent-engine/engine/main/run/agent-run-steps.util';
import { allToolObservations } from '../agent-engine/engine/graph-tool-observations.util';
import { ApprovalGateService } from '../approval/approval-gate.service';
import { ApprovalRequestService } from '../approval/approval-request.service';
import { mirrorChatApprovalRequest } from '../approval/mirror-chat-approval.util';
import { enrichChatApprovalAwaitingGateOutput } from '../approval/chat-approval-run-audit.util';
import { logWorkflowDebug } from './trace/workflow-debug.util';
import type { WorkflowRunState } from './workflow.types';

export async function applyWorkflowAwaitUserConfirmGate(
  bundle: AgentGraphNodeBundle,
  state: AgentGraphState,
  input: {
    steps: AgentGraphState['steps'];
    workflowRun: WorkflowRunState;
    taskPlan: TaskPlanSnapshot;
    nodeId: string;
  },
): Promise<AgentGraphState> {
  const { deps, ctx, runHelpers } = bundle;
  const observations = allToolObservations(state);
  const previewReady = hasUserVisibleMutationPreview({
    artifact: deps.assistantArtifact.peek(ctx.input.sessionId, ctx.input.runId),
    observations,
  });
  if (!previewReady) {
    deps.logger.warn(
      `workflow await_user_confirm blocked: no preview runId=${ctx.input.runId} nodeId=${input.nodeId}`,
    );
    runHelpers.publishMutationGateBlockedDraft(
      ctx.input.sessionId,
      ctx.input.runId,
      ctx.input.turnId,
      buildMutationPreviewUnavailableUserMessage(),
    );
    return {
      ...state,
      steps: input.steps,
      workflowRun: input.workflowRun,
      taskPlan: input.taskPlan,
      pendingToolCalls: [],
    };
  }

  const message = buildWriteConfirmationUserMessage();
  const confirmedPreviewSerialized = deps.assistantArtifact.peekSerialized(
    ctx.input.sessionId,
    ctx.input.runId,
  );
  const resumeContext: PendingWriteResumeContext = {
    steps: input.steps as PendingWriteResumeContext['steps'],
    iteration: state.iteration,
    toolObservations: serializeObservationsForPending(observations),
    scopedToolIds: state.scopedTools.map((tool) => tool.id),
    intentKind: state.intentKind,
    hasExpandedOnce: state.hasExpandedOnce,
    skillApplied: state.skillApplied === true,
    activeSkillId: state.activeSkillId ?? null,
    activeSkillPrompt: state.activeSkillPrompt ?? null,
    activeSkillName: state.activeSkillName ?? null,
    activeSkillDescription: state.activeSkillDescription ?? null,
    activeSkillConfig: state.activeSkillConfig ?? null,
    activeSkillRiskLevel: state.activeSkillRiskLevel ?? null,
    taskPlan: input.taskPlan,
    pagedListHttpUsed: state.pagedListHttpUsed,
    confirmedPreviewSerialized,
    pageContext: state.pageContext ?? null,
    workflowRun: input.workflowRun,
    workflowNodeDefs: state.workflowNodeDefs,
    workflowNodeOutputs: state.workflowNodeOutputs,
    workflowAwaitingReact: false,
  };
  await deps.pendingWriteConfirmationStore.set({
    runId: ctx.input.runId,
    turnId: ctx.input.turnId,
    sessionId: ctx.input.sessionId,
    userId: ctx.input.userId,
    appClientId: ctx.input.appClientId,
    agentId: ctx.input.agentId,
    latestUserMessage: ctx.input.latestUserMessage,
    toolCalls: [],
    resumeContext,
    createdAt: new Date().toISOString(),
  });

  let approvalRequestId: number | null = null;
  try {
    approvalRequestId = await mirrorChatApprovalRequest({
      approvalGate: deps.approvalGate,
      approvalRequests: deps.approvalRequests,
      appClientId: ctx.input.appClientId,
      userId: ctx.input.userId,
      sessionId: ctx.input.sessionId,
      runId: ctx.input.runId,
      turnId: ctx.input.turnId,
      nodeId: input.nodeId,
      workflowRun: input.workflowRun,
      workflowNodeDefs: state.workflowNodeDefs ?? [],
      workflowNodeOutputs: state.workflowNodeOutputs ?? {},
      observations,
      scopedTools: state.scopedTools,
      pageContext: state.pageContext ?? null,
      resumeContext,
    });
  } catch (error) {
    deps.logger.warn(
      `chat approval mirror failed runId=${ctx.input.runId} nodeId=${input.nodeId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  logWorkflowDebug('workflow_await_user_confirm_gate', {
    runId: ctx.input.runId,
    sessionId: ctx.input.sessionId,
    turnId: ctx.input.turnId,
    nodeId: input.nodeId,
    workflowRun: input.workflowRun,
  });

  const confirmationPayload = {
    source: 'agent-run' as const,
    action: 'confirmation_required' as const,
    runId: ctx.input.runId,
    turnId: ctx.input.turnId,
    message,
  };
  const published = deps.runSseGateway.emitConfirmationRequired(
    ctx.input.sessionId,
    {
      runId: ctx.input.runId,
      turnId: ctx.input.turnId,
      message,
    },
  );
  emitAgentMessageSseDebug({
    tag: published ? 'confirmation_required' : 'confirmation_required_suppressed',
    sessionId: ctx.input.sessionId,
    runId: ctx.input.runId,
    turnId: ctx.input.turnId,
    ssePayload: confirmationPayload,
    source: published
      ? { confirmedPreviewSerialized }
      : { reason: 'run_not_publishable' },
  });

  const gateOutputBase = runHelpers.normalizeJsonLike({
    status: 'awaiting_user',
    source: 'workflow_await_user_confirm',
    nodeId: input.nodeId,
    pendingToolCallCount: 0,
  }) as Record<string, unknown>;
  const gateStep = {
    step: nextRunStepNumber(input.steps),
    type: 'write_confirmation_gate' as const,
    output:
      approvalRequestId != null
        ? enrichChatApprovalAwaitingGateOutput(gateOutputBase, {
            approvalRequestId,
            nodeId: input.nodeId,
          })
        : gateOutputBase,
  };
  const nextSteps = [...input.steps, gateStep];
  await runHelpers.updateRun(
    ctx.input.runId,
    nextSteps,
    AgentRunStatus.success,
  );

  return {
    ...state,
    steps: nextSteps,
    workflowRun: input.workflowRun,
    taskPlan: input.taskPlan,
    pendingToolCalls: [],
    awaitingWriteConfirmation: true,
    finalOutput:
      deps.assistantArtifact.peekSerialized(
        ctx.input.sessionId,
        ctx.input.runId,
      ) ?? '',
    status: AgentRunStatus.success,
    finished: true,
  };
}
