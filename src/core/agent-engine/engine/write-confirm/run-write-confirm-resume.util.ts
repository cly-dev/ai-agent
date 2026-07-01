import { AgentRunRole, AgentRunStatus } from '../../../../../generated/prisma/client';
import { coalescePageContext } from '../../../host-bridge';
import { applyPlanAdvanceAsWorkflowProgress } from '../../../workflow/workflow-plan-transition.util';
import {
  advanceWorkflowRunAfterWriteConfirm,
  hydrateTaskPlanWithWorkflowDefs,
  prepareTaskPlanForWorkflowWriteConfirmResume,
  shouldAwaitReactOnWorkflowResume,
  workflowRunHasPendingNodes,
} from '../../../workflow/workflow-resume.util';
import {
  isWorkflowAwaitUserConfirmResume,
  resolveApprovedWriteToolNamesAfterWorkflowAwait,
} from '../../../workflow/workflow-mutation-write-gate.util';
import { logWorkflowDebug } from '../../../workflow/trace/workflow-debug.util';
import { deserializePendingObservations } from '../agent-write-confirmation.util';
import { buildWriteConfirmResumeSummaryObservation } from '../write-confirm-resume-summary.util';
import { createRunMetricsAccumulator } from '../run-metrics.util';
import { buildEngineToolsFromAllowed, executePendingWriteToolCalls } from '../main/runtime/agent-tool-runtime.util';
import { maxRunStepNumber } from '../main/run/agent-run-steps.util';
import { resolveTaskPlanAdvance } from '../main/plan/task-plan.util';
import { pendingRespondFromObservation } from '../turn/turn-respond.util';
import { isAgentRunAbortedError } from '../../../session-run/run-aborted.error';
import type { AgentGraphState, AgentRunResult, ToolObservation } from '../main/types/agent-engine.types';
import type { AgentRunStep } from '../main/types/agent-engine.types';
import type {
  RunWriteConfirmResumeInput,
  WriteConfirmResumeDeps,
} from './write-confirm-resume.types';
import type { ChatApprovalResumeAudit } from '../../../approval/chat-approval-run-audit.util';
import {
  buildChatApprovalConfirmedRunStep,
  offsetRunSteps,
} from '../../../approval/chat-approval-run-audit.util';

export async function runWriteConfirmResume(
  input: RunWriteConfirmResumeInput,
): Promise<AgentRunResult | null> {
  const { resumeInput, prepared, scope, deps } = input;
  const { session, consumed, primaryRun, suspendedPrimaryRunId } = prepared;

  const agent = await deps.agentService.getRuntimeAgent(
    session.appClientId,
    session.agentId,
  );
  if (!agent) {
    deps.host.emitWriteConfirmationExpired(resumeInput.sessionId);
    return null;
  }

  const [allowedTools, messageTokenBudget, goaPayload, runCount] =
    await Promise.all([
      deps.agentService.getAllowedTools(
        session.agentId,
        resumeInput.userId,
        session.appClientId,
      ),
      deps.llmService.getMessageTokenBudget(),
      deps.goaService.ensurePayload(resumeInput.sessionId),
      deps.prisma.agentRun.count({ where: { turnId: primaryRun.turnId } }),
    ]);
  const resumePageContext = coalescePageContext(
    resumeInput.pageContext,
    consumed.resumeContext.pageContext,
    goaPayload.lastPageContext,
  );
  if (resumeInput.pageContext) {
    await deps.goaService.syncHostPageContext(
      resumeInput.sessionId,
      resumeInput.pageContext,
    );
  }
  const prompt = await deps.promptComposer.compose({
    userId: resumeInput.userId,
    sessionId: resumeInput.sessionId,
    latestUserMessage: consumed.latestUserMessage,
    agentSystemPrompt: agent.systemPrompt,
    sessionScope: {
      appClientId: session.appClientId,
      agentId: session.agentId,
    },
    pageContext: resumePageContext,
  });

  const {
    tools,
    toolProfilesByName,
    allowedToolIds,
    langChainTools,
    toolBuildCtx,
  } = buildEngineToolsFromAllowed(
    allowedTools,
    resumeInput.userId,
    deps.toolEngine,
  );

  const scopedIdSet = new Set(consumed.resumeContext.scopedToolIds);
  const resolvedScopedTools =
    tools.filter((tool) => scopedIdSet.has(tool.id)).length > 0
      ? tools.filter((tool) => scopedIdSet.has(tool.id))
      : tools;
  const scopedAllowedToolIds = resolvedScopedTools.map((tool) => tool.id);
  const scopedToolBundle = deps.toolEngine.buildLangChainTools(
    resolvedScopedTools,
    { ...toolBuildCtx, allowedToolIds: scopedAllowedToolIds },
  );

  let priorObservations = deserializePendingObservations(
    consumed.resumeContext.toolObservations,
  );
  if (priorObservations.length === 0) {
    const goa = await deps.goaService.ensurePayload(resumeInput.sessionId);
    priorObservations = deps.goaService
      .buildPriorToolObservationsForGraph(goa)
      .map((row) => ({
        name: row.name,
        output: row.output,
      }));
  }
  const startedAt = new Date();
  scope.assertActive();
  const resumeRun = await deps.prisma.agentRun.create({
    data: {
      turnId: primaryRun.turnId,
      agentId: agent.id,
      appClientId: session.appClientId,
      sessionId: session.id,
      userId: resumeInput.userId,
      role: AgentRunRole.worker,
      sequence: runCount + 1,
      input: consumed.latestUserMessage,
      status: AgentRunStatus.running,
      steps: [],
      currentStep: 0,
      maxSteps: agent.maxSteps,
      startedAt,
    },
  });

  scope.startRun(resumeRun.id, primaryRun.turnId);
  scope.assertActive(resumeRun.id);

  let workerLeadSteps: AgentRunStep[] = [];
  if (input.approvalAudit) {
    workerLeadSteps = [
      buildChatApprovalConfirmedRunStep(1, {
        approvalRequestId: input.approvalAudit.approvalRequestId,
        primaryRunId: suspendedPrimaryRunId,
        resumeChannel: input.approvalAudit.resumeChannel,
        decidedByUserId: input.approvalAudit.decidedByUserId,
        nodeId: input.approvalAudit.nodeId,
      }),
    ];
  }

  const approvedWriteToolNamesFromPending = consumed.toolCalls.map(
    (call) => call.name,
  );
  const isWorkflowAwaitResume = isWorkflowAwaitUserConfirmResume({
    pendingToolCalls: consumed.toolCalls,
    workflowRun: consumed.resumeContext.workflowRun ?? null,
  });
  let writeObservations: Awaited<
    ReturnType<typeof executePendingWriteToolCalls>
  >['observations'] = [];
  let writeSteps: Awaited<
    ReturnType<typeof executePendingWriteToolCalls>
  >['steps'] = [];
  let writeRoundMeta: Awaited<
    ReturnType<typeof executePendingWriteToolCalls>
  >['lastToolRoundMeta'] = {
    toolCalls: [],
    executionStatuses: [],
    roundObservationIndices: [],
    errorDispositions: [],
  };

  if (!isWorkflowAwaitResume) {
    const writeResult = await executePendingWriteToolCalls({
      latestUserMessage: consumed.latestUserMessage,
      toolCalls: consumed.toolCalls,
      tools: resolvedScopedTools,
      langChainBundle: scopedToolBundle,
      priorSteps: [],
      priorObservations,
      toolEngine: deps.toolEngine,
      assessObservationQuality: (output, agentMetadata) =>
        deps.langGraphRunner.assessObservationQualityForResume(
          output,
          agentMetadata,
        ),
      runId: resumeRun.id,
      sessionId: resumeInput.sessionId,
      onToolDebugLog: (message) => deps.logger.log(message),
      assertContinue: () => scope.assertActive(resumeRun.id),
    });
    writeObservations = writeResult.observations;
    writeSteps = writeResult.steps;
    writeRoundMeta = writeResult.lastToolRoundMeta;

    if (writeObservations.length === 0) {
      if (workerLeadSteps.length > 0) {
        await deps.lifecycle.updateRun(
          resumeRun.id,
          workerLeadSteps,
          AgentRunStatus.failed,
        );
      } else {
        await deps.lifecycle.updateRun(resumeRun.id, [], AgentRunStatus.failed);
      }
      deps.host.emitWriteConfirmationExpired(resumeInput.sessionId);
      return null;
    }

    writeSteps = offsetRunSteps(writeSteps, workerLeadSteps.length + 1);
    await deps.lifecycle.updateRun(
      resumeRun.id,
      [...workerLeadSteps, ...writeSteps],
      AgentRunStatus.running,
    );
  } else if (workerLeadSteps.length > 0) {
    await deps.lifecycle.updateRun(
      resumeRun.id,
      workerLeadSteps,
      AgentRunStatus.running,
    );
  }

  const combinedWorkerSteps: AgentRunStep[] = [...workerLeadSteps, ...writeSteps];

  const approvedWriteToolNames = isWorkflowAwaitResume
    ? resolveApprovedWriteToolNamesAfterWorkflowAwait({
        observations: priorObservations,
        scopedTools: resolvedScopedTools,
        workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
      })
    : approvedWriteToolNamesFromPending;

  const runMetrics = createRunMetricsAccumulator();
  deps.assistantArtifact.reset(
    resumeInput.sessionId,
    resumeRun.id,
    primaryRun.turnId,
  );
  deps.sse.clearThinkBuffer(resumeInput.sessionId, resumeRun.id);
  scope.assertActive(resumeRun.id);

  const iterationAfterWrites = isWorkflowAwaitResume
    ? maxRunStepNumber(consumed.resumeContext.steps ?? [])
    : maxRunStepNumber(combinedWorkerSteps);
  const allObservations: ToolObservation[] = [
    ...priorObservations,
    ...writeObservations,
  ];
  let taskPlan = consumed.resumeContext.taskPlan ?? null;
  if (taskPlan && consumed.resumeContext.workflowNodeDefs?.length) {
    taskPlan =
      hydrateTaskPlanWithWorkflowDefs({
        taskPlan,
        workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
      }) ?? taskPlan;
  }
  let pendingRespond: AgentGraphState['pendingRespond'] = null;

  let workflowRun = consumed.resumeContext.workflowRun ?? null;
  const workflowRunBeforeAdvance = workflowRun;
  if (workflowRun) {
    workflowRun = advanceWorkflowRunAfterWriteConfirm(workflowRun);
  }
  if (taskPlan && isWorkflowAwaitResume && workflowRunBeforeAdvance) {
    taskPlan =
      prepareTaskPlanForWorkflowWriteConfirmResume({
        taskPlan,
        workflowRunBeforeAdvance,
        workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
        workflowRunAfterAdvance: workflowRun,
      }) ?? taskPlan;
  }
  const workflowContinues = workflowRunHasPendingNodes(workflowRun);

  logWorkflowDebug('write_confirm_resume', {
    runId: resumeRun.id,
    sessionId: resumeInput.sessionId,
    turnId: primaryRun.turnId,
    primaryRunId: suspendedPrimaryRunId,
    workflowContinues,
    workflowRun,
    writeToolCount: writeRoundMeta.toolCalls.length,
  });

  if (writeRoundMeta.toolCalls.length > 0) {
    if (taskPlan) {
      const planAdvance = resolveTaskPlanAdvance({
        phase: 'post_tools',
        plan: taskPlan,
        observations: allObservations,
        executionStatuses: writeRoundMeta.executionStatuses,
        roundObservationIndices: writeRoundMeta.roundObservationIndices,
        scopedTools: resolvedScopedTools,
        toolCalls: writeRoundMeta.toolCalls,
      });
      if (planAdvance) {
        const progressed = applyPlanAdvanceAsWorkflowProgress({
          taskPlan,
          workflowRun,
          workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
          planBefore: taskPlan,
          planAdvance,
        });
        taskPlan = (progressed.taskPlan as typeof taskPlan) ?? taskPlan;
        if (progressed.workflowRun) {
          workflowRun = progressed.workflowRun;
        }
      }
    }

    if (!workflowContinues) {
      const resumeSummaryObservation = buildWriteConfirmResumeSummaryObservation({
        userMessage: consumed.latestUserMessage,
        writeRoundMeta,
        observations: allObservations,
        scopedTools: resolvedScopedTools,
      });
      pendingRespond = resumeSummaryObservation
        ? pendingRespondFromObservation(resumeSummaryObservation)
        : null;
    }
  }

  const graphInitialState: Partial<AgentGraphState> = {
    iteration: iterationAfterWrites,
      steps: combinedWorkerSteps,
    preloadedToolObservations: priorObservations,
    toolObservations: writeObservations,
    pendingToolCalls: [],
    pendingRespond,
    lastToolRoundMeta: writeRoundMeta,
    intentKind: consumed.resumeContext.intentKind,
    scopedTools: resolvedScopedTools,
    scopedLangChainTools: scopedToolBundle.tools,
    scopedToolBundle,
    scopedAllowedToolIds,
    toolProfilesByName,
    hasExpandedOnce: consumed.resumeContext.hasExpandedOnce,
    skillApplied: consumed.resumeContext.skillApplied === true,
    activeSkillId: consumed.resumeContext.activeSkillId ?? null,
    activeSkillPrompt: consumed.resumeContext.activeSkillPrompt ?? null,
    activeSkillName: consumed.resumeContext.activeSkillName ?? null,
    activeSkillDescription: consumed.resumeContext.activeSkillDescription ?? null,
    activeSkillConfig: consumed.resumeContext.activeSkillConfig ?? null,
    activeSkillRiskLevel: consumed.resumeContext.activeSkillRiskLevel ?? null,
    taskPlan,
    pagedListHttpUsed: consumed.resumeContext.pagedListHttpUsed ?? 0,
    confirmedPreviewSerialized:
      consumed.resumeContext.confirmedPreviewSerialized?.trim() ||
      (
        await deps.prisma.agentRun.findUnique({
          where: { id: primaryRun.id },
          select: { output: true },
        })
      )?.output ||
      null,
    pageContext: resumePageContext,
    ...(workflowRun
      ? {
          workflowRun,
          workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
          workflowNodeOutputs: consumed.resumeContext.workflowNodeOutputs ?? {},
          workflowAwaitingReact: isWorkflowAwaitResume
            ? shouldAwaitReactOnWorkflowResume(
                workflowRun,
                consumed.resumeContext.workflowNodeDefs ?? [],
              )
            : consumed.resumeContext.workflowAwaitingReact === true,
        }
      : {}),
  };

  try {
    scope.assertActive(resumeRun.id);
    const graphState = await deps.langGraphRunner.run({
      promptMessages: prompt.messages,
      latestUserMessage: consumed.latestUserMessage,
      sessionId: resumeInput.sessionId,
      runId: resumeRun.id,
      userId: resumeInput.userId,
      appClientId: session.appClientId,
      agentId: agent.id,
      maxSteps: agent.maxSteps,
      enableToolCall: agent.enableToolCall,
      tools,
      langChainTools,
      toolBuildCtx,
      allowedToolIds,
      messageTokenBudget,
      runMetrics,
      toolProfilesByName,
      turnId: primaryRun.turnId,
      resumeFromWriteConfirm: true,
      graphInitialState,
      approvedWriteToolNames,
      pageContext: resumePageContext,
      runGeneration: scope.generation,
      abortSignal: scope.abortSignal,
    });

    const result = await deps.lifecycle.completeAgentRunFromGraph({
      userId: resumeInput.userId,
      sessionId: resumeInput.sessionId,
      turnId: primaryRun.turnId,
      runId: resumeRun.id,
      agent,
      latestUserMessage: consumed.latestUserMessage,
      graphState,
      runMetrics,
    });
    await deps.host.emitRunCompletion(
      resumeInput.sessionId,
      result,
      graphState,
      resumePageContext,
      {
        appClientId: session.appClientId,
        agentId: agent.id,
      },
    );
    return result;
  } catch (error) {
    if (isAgentRunAbortedError(error)) {
      const partial = await deps.prisma.agentRun.findUnique({
        where: { id: resumeRun.id },
        select: { steps: true },
      });
      await deps.host.handleRunAborted({
        error,
        sessionId: resumeInput.sessionId,
        turnId: primaryRun.turnId,
        runId: resumeRun.id,
        runMetrics,
        scopedToolCount: tools.length,
        steps: deps.lifecycle.parseStepsFromRun(partial?.steps),
      });
      throw error;
    }
    const partial = await deps.prisma.agentRun.findUnique({
      where: { id: resumeRun.id },
      select: { steps: true },
    });
    const partialSteps = deps.lifecycle.parseStepsFromRun(partial?.steps);
    const result = await deps.host.handleRunFailure({
      error,
      userId: resumeInput.userId,
      sessionId: resumeInput.sessionId,
      turnId: primaryRun.turnId,
      runId: resumeRun.id,
      runMetrics,
      scopedToolCount: tools.length,
      scheduleMemory: deps.lifecycle.buildFailureMemoryContext({
        turnId: primaryRun.turnId,
        runId: resumeRun.id,
        userInput: consumed.latestUserMessage,
        finalOutput: '',
        steps: partialSteps,
      }),
    });
    if (result) {
      deps.host.emitAgentRunComplete(resumeInput.sessionId, result);
    }
    return result;
  } finally {
    scope.endRun(resumeRun.id);
    deps.sse.clearThinkBuffer(resumeInput.sessionId, resumeRun.id);
    deps.assistantArtifact.clear(resumeInput.sessionId, resumeRun.id);
  }
}

export function buildWriteConfirmResumeDeps(
  host: WriteConfirmResumeDeps['host'],
  services: Omit<WriteConfirmResumeDeps, 'host'>,
): WriteConfirmResumeDeps {
  return { host, ...services };
}
