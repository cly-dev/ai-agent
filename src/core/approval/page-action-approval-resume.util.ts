import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { orchestratePageWorkflow } from '../page-action/page-workflow-orchestrator';
import { loadPageWorkflowToolBundle } from '../page-action/page-workflow-tool-bundle.util';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalGateService } from './approval-gate.service';
import {
  loadWorkflowForRunDetailed,
  parseWorkflowOverridesJson,
} from '../workflow/load-workflow-definition.util';
import { resolvePageActionHostTool } from '../page-action/page-action-host-tool.util';
import { buildPageActionLlmMessages } from '../page-action/page-action-prompt.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../modules/host-tool/host-tool.types';
import type { LlmService } from '../llm/llm.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { PageActionRunEventBus } from '../page-action/stream/page-action-run-event-bus.types';
import { createNullPageActionSseSink } from '../page-action/stream/page-action-sse-sink.util';
import {
  buildRetryUserMessage,
  resolveWriteDraftFromApprovalSnapshot,
  rewindWorkflowForDraftRetry,
  stripNodeOutputsForRetry,
} from '../draft-review';
import { buildWriteDraftStepDetail } from '../page-action/page-action-run-audit.util';
import type { DraftReviewDecision } from '../draft-review';
import { resolveApprovalSnapshotForDecision } from './validate-approval-edited-pending-write.util';
import {
  emitPageActionRunTerminalSse,
  mapTerminalPhaseToRunStatus,
  resolvePageActionRunTerminalOutcome,
} from '../page-action/page-action-run-terminal-sse.util';

export async function resumePageActionFromApprovalSnapshot(input: {
  snapshot: ApprovalResumeSnapshot;
  approvalRequestId: number;
  decision?: DraftReviewDecision | null;
  prisma: PrismaService;
  llmService: LlmService;
  toolEngine: ToolEngineService;
  approvalGate: ApprovalGateService;
  runEventBus?: PageActionRunEventBus | null;
}): Promise<void> {
  const { snapshot } = input;
  if (snapshot.channel.kind !== 'page_action') {
    return;
  }
  const run = await input.prisma.pageActionRun.findUnique({
    where: { id: snapshot.channel.pageActionRunId },
    include: {
      pageAction: {
        include: {
          hostTool: { include: HOST_TOOL_DETAIL_INCLUDE },
        },
      },
    },
  });
  if (!run?.pageAction) {
    throw new NotFoundException('PageActionRun not found for resume');
  }

  const draft = resolveWriteDraftFromApprovalSnapshot(snapshot);
  const editsAlreadyApplied =
    draft.provenance.lastEvent === 'user_edit' &&
    input.decision?.action === 'confirm_with_edits';

  const effectiveSnapshot = editsAlreadyApplied
    ? snapshot
    : await resolveApprovalSnapshotForDecision({
        snapshot,
        decision: input.decision ?? null,
        userId: run.userId,
        prisma: input.prisma,
        toolEngine: input.toolEngine,
      });

  const pageContext = (run.pageContext ?? null) as AgentChatPageContext | null;
  const hostTool = run.pageAction.hostTool
    ? resolvePageActionHostTool(run.pageAction.hostTool, pageContext)
    : null;
  const messages = buildPageActionLlmMessages({
    systemPrompt: run.pageAction.systemPrompt,
    instruction: run.instruction,
    context: run.context as Record<string, unknown> | null,
    pageContext,
  });

  const recorder = PageActionRunStepRecorder.fromJson(run.steps);
  recorder.recordLifecycle('approval_confirmed', {
    approvalRequestId: input.approvalRequestId,
    edited: input.decision?.action === 'confirm_with_edits',
  });

  const loadResult = await loadWorkflowForRunDetailed(input.prisma, {
    workflowId: effectiveSnapshot.workflowRun.workflowId,
    appClientId: run.appClientId,
    workflowVersion: effectiveSnapshot.workflowRun.version,
    workflowOverrides: parseWorkflowOverridesJson(
      run.pageAction.workflowOverrides,
    ),
  });
  if (loadResult.status !== 'loaded') {
    throw new NotFoundException('Workflow not loadable for resume');
  }

  input.runEventBus?.prepareSession(run.id);
  const sseSink =
    input.runEventBus?.openWriter(run.id) ?? createNullPageActionSseSink();

  const toolBundle = await loadPageWorkflowToolBundle({
    prisma: input.prisma,
    toolEngine: input.toolEngine,
    userId: run.userId,
    appClientId: run.appClientId,
    allowedToolIds: effectiveSnapshot.scopedToolIds,
  });

  const result = await orchestratePageWorkflow({
    workflowId: loadResult.workflowId,
    version: loadResult.version,
    nodes: loadResult.nodes,
    systemPrompt: run.pageAction.systemPrompt,
    objectivePrefix: run.instruction,
    messages,
    pageContext,
    hostTool,
    llmService: input.llmService,
    prisma: input.prisma,
    toolEngine: input.toolEngine,
    userId: run.userId,
    appClientId: run.appClientId,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    sseSink,
    stepRecorder: recorder,
    allowedToolIds: effectiveSnapshot.scopedToolIds,
    toolBundle,
    approvalGate: input.approvalGate,
    pageActionKey: run.pageActionKey,
    resumeFrom: {
      workflowRun: effectiveSnapshot.workflowRun,
      nodeOutputs: effectiveSnapshot.workflowNodeOutputs,
      pendingWrite: effectiveSnapshot.pendingWrite,
      advancePastAwait: true,
    },
  });

  const terminal = resolvePageActionRunTerminalOutcome(result.completion);

  emitPageActionRunTerminalSse({
    sseSink,
    recorder,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    streamId: run.streamId,
    outcome: terminal,
    dslOutcome: result.dslOutcome,
  });
  input.runEventBus?.closeSession(run.id);

  await input.prisma.pageActionRun.update({
    where: { id: run.id },
    data: {
      status: mapTerminalPhaseToRunStatus(terminal.phase),
      workflowRun: result.workflowRun as object,
      fillText: terminal.fillText,
      dslOutcome: result.dslOutcome,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      finishedAt: terminal.phase === 'awaiting_approval' ? null : new Date(),
      steps: recorder.toJson() as Prisma.InputJsonValue,
      errorCode: terminal.errorCode,
      errorMessage: terminal.errorMessage,
    },
  });
}

export async function retryPageActionFromApprovalSnapshot(input: {
  snapshot: ApprovalResumeSnapshot;
  approvalRequestId: number;
  retryInstruction: string;
  prisma: PrismaService;
  llmService: LlmService;
  toolEngine: ToolEngineService;
  approvalGate: ApprovalGateService;
  runEventBus?: PageActionRunEventBus | null;
}): Promise<boolean> {
  const { snapshot } = input;
  if (snapshot.channel.kind !== 'page_action') {
    return false;
  }
  const run = await input.prisma.pageActionRun.findUnique({
    where: { id: snapshot.channel.pageActionRunId },
    include: {
      pageAction: {
        include: {
          hostTool: { include: HOST_TOOL_DETAIL_INCLUDE },
        },
      },
    },
  });
  if (!run?.pageAction) {
    throw new NotFoundException('PageActionRun not found for retry');
  }

  const rewind = rewindWorkflowForDraftRetry({
    workflowRun: snapshot.workflowRun,
    workflowNodeDefs: snapshot.workflowNodeDefs,
    nodeOutputs: snapshot.workflowNodeOutputs,
  });
  const retrySnapshot: ApprovalResumeSnapshot = {
    ...snapshot,
    workflowRun: rewind.workflowRun,
    workflowNodeOutputs: stripNodeOutputsForRetry(
      snapshot.workflowNodeOutputs,
      rewind.clearedOutputKeys,
    ),
    draftRetryCount: snapshot.draftRetryCount ?? 0,
  };

  const pageContext = (run.pageContext ?? null) as AgentChatPageContext | null;
  const hostTool = run.pageAction.hostTool
    ? resolvePageActionHostTool(run.pageAction.hostTool, pageContext)
    : null;
  const retryObjective = buildRetryUserMessage({
    baseUserMessage: run.instruction,
    retryInstruction: input.retryInstruction,
  });
  const messages = buildPageActionLlmMessages({
    systemPrompt: run.pageAction.systemPrompt,
    instruction: retryObjective,
    context: run.context as Record<string, unknown> | null,
    pageContext,
  });

  const recorder = PageActionRunStepRecorder.fromJson(run.steps);
  const previousWriteDraft = resolveWriteDraftFromApprovalSnapshot(snapshot);
  recorder.recordLifecycle('approval_retry_requested', {
    approvalRequestId: input.approvalRequestId,
    retryInstruction: input.retryInstruction,
    retryNodeId: rewind.retryNodeId,
    clearedOutputKeys: rewind.clearedOutputKeys,
    draftRetryCount: snapshot.draftRetryCount ?? 0,
    previousWriteDraft: buildWriteDraftStepDetail(previousWriteDraft),
  });

  const loadResult = await loadWorkflowForRunDetailed(input.prisma, {
    workflowId: retrySnapshot.workflowRun.workflowId,
    appClientId: run.appClientId,
    workflowVersion: retrySnapshot.workflowRun.version,
    workflowOverrides: parseWorkflowOverridesJson(
      run.pageAction.workflowOverrides,
    ),
  });
  if (loadResult.status !== 'loaded') {
    throw new NotFoundException('Workflow not loadable for retry');
  }

  input.runEventBus?.prepareSession(run.id);
  const sseSink =
    input.runEventBus?.openWriter(run.id) ?? createNullPageActionSseSink();

  const toolBundle = await loadPageWorkflowToolBundle({
    prisma: input.prisma,
    toolEngine: input.toolEngine,
    userId: run.userId,
    appClientId: run.appClientId,
    allowedToolIds: retrySnapshot.scopedToolIds,
  });

  const result = await orchestratePageWorkflow({
    workflowId: loadResult.workflowId,
    version: loadResult.version,
    nodes: loadResult.nodes,
    systemPrompt: run.pageAction.systemPrompt,
    objectivePrefix: retryObjective,
    messages,
    pageContext,
    hostTool,
    llmService: input.llmService,
    prisma: input.prisma,
    toolEngine: input.toolEngine,
    userId: run.userId,
    appClientId: run.appClientId,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    sseSink,
    stepRecorder: recorder,
    allowedToolIds: retrySnapshot.scopedToolIds,
    toolBundle,
    approvalGate: input.approvalGate,
    existingApprovalRequestId: input.approvalRequestId,
    retryInstruction: input.retryInstruction,
    pageActionKey: run.pageActionKey,
    resumeFrom: {
      workflowRun: retrySnapshot.workflowRun,
      nodeOutputs: retrySnapshot.workflowNodeOutputs,
      advancePastAwait: false,
    },
  });

  const terminal = resolvePageActionRunTerminalOutcome(result.completion);

  emitPageActionRunTerminalSse({
    sseSink,
    recorder,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    streamId: run.streamId,
    outcome: terminal,
    dslOutcome: result.dslOutcome,
  });
  input.runEventBus?.closeSession(run.id);

  await input.prisma.pageActionRun.update({
    where: { id: run.id },
    data: {
      status: mapTerminalPhaseToRunStatus(terminal.phase),
      workflowRun: result.workflowRun as object,
      fillText: terminal.fillText,
      dslOutcome: result.dslOutcome,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      finishedAt: terminal.phase === 'awaiting_approval' ? null : new Date(),
      steps: recorder.toJson() as Prisma.InputJsonValue,
      errorCode: terminal.errorCode,
      errorMessage: terminal.errorMessage,
    },
  });

  return result.suspended === true;
}
