import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { orchestratePageWorkflow } from '../page-action/page-workflow-orchestrator';
import { loadPageWorkflowToolBundle } from '../page-action/page-workflow-tool-bundle.util';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import {
  isApprovalResumeSnapshotV2,
  resolveApprovalResumeNodeDefs,
} from './approval-resume-snapshot.types';
import type { ApprovalGateService } from './approval-gate.service';
import {
  parseWorkflowOverridesJson,
} from '../workflow/load-workflow-definition.util';
import { loadFlowForRunDetailed } from '../workflow/load-flow-for-run.util';
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
import { resolvePageActionRunOutputText } from '../page-action/resolve-page-action-run-output-text.util';

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

  // 以本次 run / 审批单审计身份为准；pageAction 重绑后不得改已挂起审批的资产。
  // 运行时只认 Flow，不再回退 legacy Workflow。
  const approvalRow = await input.prisma.approvalRequest.findUnique({
    where: { id: input.approvalRequestId },
    select: { flowId: true, flowVersion: true },
  });
  const resumeFlowId =
    (isApprovalResumeSnapshotV2(effectiveSnapshot)
      ? effectiveSnapshot.flow.id
      : null) ??
    run.flowId ??
    approvalRow?.flowId ??
    run.pageAction.flowId ??
    (effectiveSnapshot.workflowRun.compiledFrom === 'flow_db'
      ? effectiveSnapshot.workflowRun.workflowId
      : null);
  const resumeFlowVersion =
    (isApprovalResumeSnapshotV2(effectiveSnapshot)
      ? effectiveSnapshot.flow.version
      : null) ??
    run.flowVersion ??
    approvalRow?.flowVersion ??
    run.pageAction.flowVersion ??
    (resumeFlowId != null ? effectiveSnapshot.workflowRun.version : null);
  if (resumeFlowId == null || resumeFlowId <= 0) {
    throw new NotFoundException(
      'Flow required for approval resume; legacy Workflow path removed',
    );
  }
  const loadResult = await loadFlowForRunDetailed(input.prisma, {
    flowId: resumeFlowId,
    appClientId: run.appClientId,
    flowVersion: resumeFlowVersion ?? effectiveSnapshot.workflowRun.version,
    workflowOverrides: parseWorkflowOverridesJson(
      run.pageAction.workflowOverrides,
    ),
  });
  if (loadResult.status !== 'loaded') {
    throw new NotFoundException('Flow not loadable for resume');
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
    flowId: resumeFlowId,
    flowVersion: resumeFlowVersion ?? loadResult.version,
    nodes: loadResult.nodes,
    edges: loadResult.edges,
    entryNodeId: loadResult.entryNodeId,
    ir: loadResult.ir,
    executionMode: loadResult.executionMode,
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
  const persistedFillText = resolvePageActionRunOutputText({
    fillText: terminal.fillText,
    errorMessage: terminal.errorMessage,
    steps: recorder.toJson(),
  });
  const terminalOutcome = {
    ...terminal,
    fillText: persistedFillText,
  };

  emitPageActionRunTerminalSse({
    sseSink,
    recorder,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    streamId: run.streamId,
    outcome: terminalOutcome,
    dslOutcome: result.dslOutcome,
  });
  input.runEventBus?.closeSession(run.id);

  await input.prisma.pageActionRun.update({
    where: { id: run.id },
    data: {
      status: mapTerminalPhaseToRunStatus(terminalOutcome.phase),
      workflowRun: result.workflowRun as object,
      fillText: persistedFillText,
      dslOutcome: result.dslOutcome,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      finishedAt: terminalOutcome.phase === 'awaiting_approval' ? null : new Date(),
      steps: recorder.toJson() as Prisma.InputJsonValue,
      errorCode: terminalOutcome.errorCode,
      errorMessage: terminalOutcome.errorMessage,
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

  // 与 confirm 一致：先钉 Flow 再 rewind（v2 以重载图为 defs 真源）
  const approvalRow = await input.prisma.approvalRequest.findUnique({
    where: { id: input.approvalRequestId },
    select: { flowId: true, flowVersion: true },
  });
  const retryFlowId =
    (isApprovalResumeSnapshotV2(snapshot) ? snapshot.flow.id : null) ??
    run.flowId ??
    approvalRow?.flowId ??
    run.pageAction.flowId ??
    (snapshot.workflowRun.compiledFrom === 'flow_db'
      ? snapshot.workflowRun.workflowId
      : null);
  const retryFlowVersion =
    (isApprovalResumeSnapshotV2(snapshot) ? snapshot.flow.version : null) ??
    run.flowVersion ??
    approvalRow?.flowVersion ??
    run.pageAction.flowVersion ??
    (retryFlowId != null ? snapshot.workflowRun.version : null);
  if (retryFlowId == null || retryFlowId <= 0) {
    throw new NotFoundException(
      'Flow required for approval retry; legacy Workflow path removed',
    );
  }
  const loadResult = await loadFlowForRunDetailed(input.prisma, {
    flowId: retryFlowId,
    appClientId: run.appClientId,
    flowVersion: retryFlowVersion ?? snapshot.workflowRun.version,
    workflowOverrides: parseWorkflowOverridesJson(
      run.pageAction.workflowOverrides,
    ),
  });
  if (loadResult.status !== 'loaded') {
    throw new NotFoundException('Flow not loadable for retry');
  }

  const rewind = rewindWorkflowForDraftRetry({
    workflowRun: snapshot.workflowRun,
    workflowNodeDefs: resolveApprovalResumeNodeDefs(
      snapshot,
      loadResult.nodes,
    ),
    nodeOutputs: snapshot.workflowNodeOutputs,
    ir: loadResult.ir,
  });
  const retrySnapshot: ApprovalResumeSnapshot = {
    ...snapshot,
    workflowRun: rewind.workflowRun,
    workflowNodeOutputs: stripNodeOutputsForRetry(
      snapshot.workflowNodeOutputs,
      rewind.clearedOutputKeys,
    ),
    draftRetryCount: snapshot.draftRetryCount ?? 0,
    ...(isApprovalResumeSnapshotV2(snapshot) && rewind.retryNodeId
      ? {
          suspended: {
            ...snapshot.suspended,
            irNodeId: rewind.retryNodeId,
            phase:
              rewind.workflowRun.nodes.find(
                (n) => n.nodeId === rewind.retryNodeId,
              )?.phase ?? snapshot.suspended.phase,
          },
        }
      : {}),
  };

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
    flowId: retryFlowId,
    flowVersion: retryFlowVersion ?? loadResult.version,
    nodes: loadResult.nodes,
    edges: loadResult.edges,
    entryNodeId: loadResult.entryNodeId,
    ir: loadResult.ir,
    executionMode: loadResult.executionMode,
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
  const persistedFillText = resolvePageActionRunOutputText({
    fillText: terminal.fillText,
    errorMessage: terminal.errorMessage,
    steps: recorder.toJson(),
  });
  const terminalOutcome = {
    ...terminal,
    fillText: persistedFillText,
  };

  emitPageActionRunTerminalSse({
    sseSink,
    recorder,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    streamId: run.streamId,
    outcome: terminalOutcome,
    dslOutcome: result.dslOutcome,
  });
  input.runEventBus?.closeSession(run.id);

  await input.prisma.pageActionRun.update({
    where: { id: run.id },
    data: {
      status: mapTerminalPhaseToRunStatus(terminalOutcome.phase),
      workflowRun: result.workflowRun as object,
      fillText: persistedFillText,
      dslOutcome: result.dslOutcome,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      finishedAt: terminalOutcome.phase === 'awaiting_approval' ? null : new Date(),
      steps: recorder.toJson() as Prisma.InputJsonValue,
      errorCode: terminalOutcome.errorCode,
      errorMessage: terminalOutcome.errorMessage,
    },
  });

  return result.suspended === true;
}
