import { AgentRunRole, AgentRunStatus } from '../../../../../generated/prisma/client';
import { coalescePageContext } from '../../../host-bridge';
import { hydrateTaskPlanWithWorkflowDefs } from '../../../workflow/workflow-resume.util';
import { logWorkflowDebug } from '../../../workflow/trace/workflow-debug.util';
import { deserializePendingObservations } from '../agent-write-confirmation.util';
import { createRunMetricsAccumulator } from '../run-metrics.util';
import { buildEngineToolsFromAllowedWithCredentials } from '../main/runtime/agent-tool-runtime.util';
import { maxRunStepNumber } from '../main/run/agent-run-steps.util';
import { isAgentRunAbortedError } from '../../../session-run/run-aborted.error';
import type { AgentGraphState, AgentRunResult, ToolObservation } from '../main/types/agent-engine.types';
import type { AgentRunStep } from '../main/types/agent-engine.types';
import type {
  RunWriteConfirmResumeInput,
  WriteConfirmResumeDeps,
} from './write-confirm-resume.types';
import {
  buildRetryUserMessage,
  rewindWorkflowForDraftRetry,
  stripNodeOutputsForRetry,
} from '../../../draft-review';
import type { DraftReviewDecision } from '../../../draft-review';

export type RunWriteGateRetryInput = {
  resumeInput: RunWriteConfirmResumeInput['resumeInput'];
  prepared: RunWriteConfirmResumeInput['prepared'];
  scope: RunWriteConfirmResumeInput['scope'];
  deps: WriteConfirmResumeDeps;
  decision: DraftReviewDecision;
};

function buildChatWriteConfirmRetryRunStep(
  stepNumber: number,
  input: {
    primaryRunId: number;
    decidedByUserId: number;
    retryInstruction: string;
    nodeId?: string | null;
  },
): AgentRunStep {
  return {
    step: stepNumber,
    type: 'write_confirmation_gate',
    output: {
      status: 'retry_requested',
      auditPhase: 'draft_retry',
      primaryRunId: input.primaryRunId,
      decidedByUserId: input.decidedByUserId,
      retryInstruction: input.retryInstruction,
      nodeId: input.nodeId ?? null,
    },
  };
}

export async function runWriteGateRetry(
  input: RunWriteGateRetryInput,
): Promise<AgentRunResult | null> {
  const { resumeInput, prepared, scope, deps, decision } = input;
  const { session, consumed, primaryRun, suspendedPrimaryRunId } = prepared;
  const retryInstruction = decision.retryInstruction?.trim() ?? '';
  if (!retryInstruction) {
    deps.host.emitWriteConfirmationExpired(resumeInput.sessionId);
    return null;
  }

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

  const retryUserMessage = buildRetryUserMessage({
    baseUserMessage: consumed.latestUserMessage,
    retryInstruction,
  });

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
    latestUserMessage: retryUserMessage,
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
  } = await buildEngineToolsFromAllowedWithCredentials(
    allowedTools,
    resumeInput.userId,
    deps.toolEngine,
    deps.prisma,
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
    priorObservations = deps.goaService
      .buildPriorToolObservationsForGraph(goaPayload)
      .map((row) => ({
        name: row.name,
        output: row.output,
      }));
  }

  const priorSteps = (consumed.resumeContext.steps ?? []) as AgentRunStep[];
  const retryAuditStep = buildChatWriteConfirmRetryRunStep(
    priorSteps.length > 0 ? maxRunStepNumber(priorSteps) + 1 : 1,
    {
      primaryRunId: suspendedPrimaryRunId,
      decidedByUserId: resumeInput.userId,
      retryInstruction,
      nodeId: consumed.resumeContext.workflowRun?.currentNodeId ?? null,
    },
  );

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
      input: retryUserMessage,
      status: AgentRunStatus.running,
      steps: [],
      currentStep: 0,
      maxSteps: agent.maxSteps,
      startedAt,
    },
  });

  scope.startRun(resumeRun.id, primaryRun.turnId);
  scope.assertActive(resumeRun.id);
  await deps.lifecycle.updateRun(
    resumeRun.id,
    [retryAuditStep],
    AgentRunStatus.running,
  );

  let workflowRun = consumed.resumeContext.workflowRun ?? null;
  let workflowNodeOutputs = consumed.resumeContext.workflowNodeOutputs ?? {};
  const workflowNodeDefs = consumed.resumeContext.workflowNodeDefs;
  if (workflowRun && workflowNodeDefs?.length) {
    const rewind = rewindWorkflowForDraftRetry({
      workflowRun,
      workflowNodeDefs,
      nodeOutputs: workflowNodeOutputs,
    });
    workflowRun = rewind.workflowRun;
    workflowNodeOutputs = stripNodeOutputsForRetry(
      workflowNodeOutputs,
      rewind.clearedOutputKeys,
    );
    logWorkflowDebug('write_gate_retry_rewind', {
      runId: resumeRun.id,
      sessionId: resumeInput.sessionId,
      retryNodeId: rewind.retryNodeId,
      workflowRun,
    });
  }

  let taskPlan = consumed.resumeContext.taskPlan ?? null;
  if (taskPlan && workflowNodeDefs?.length) {
    taskPlan =
      hydrateTaskPlanWithWorkflowDefs({
        taskPlan,
        workflowNodeDefs,
      }) ?? taskPlan;
  }

  const runMetrics = createRunMetricsAccumulator();
  deps.assistantArtifact.reset(
    resumeInput.sessionId,
    resumeRun.id,
    primaryRun.turnId,
  );
  deps.sse.clearThinkBuffer(resumeInput.sessionId, resumeRun.id);
  scope.assertActive(resumeRun.id);

  const graphInitialState: Partial<AgentGraphState> = {
    iteration: consumed.resumeContext.iteration,
    steps: [...priorSteps, retryAuditStep],
    preloadedToolObservations: priorObservations,
    toolObservations: [],
    pendingToolCalls: [],
    pendingRespond: null,
    lastToolRoundMeta: null,
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
    confirmedPreviewSerialized: null,
    pageContext: resumePageContext,
    draftRetryCount: consumed.resumeContext.draftRetryCount ?? 0,
    planRunContext: 'resume',
    ...(workflowRun
      ? {
          workflowRun,
          workflowNodeDefs,
          workflowNodeOutputs,
          workflowAwaitingReact: false,
        }
      : {}),
  };

  try {
    scope.assertActive(resumeRun.id);
    const graphState = await deps.langGraphRunner.run({
      promptMessages: prompt.messages,
      latestUserMessage: retryUserMessage,
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
      resumeFromWriteGateRetry: true,
      graphInitialState,
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
      latestUserMessage: retryUserMessage,
      graphState,
      runMetrics,
    });

    await deps.host.emitRunCompletion(
      resumeInput.sessionId,
      result,
      graphState,
      resumePageContext,
      { appClientId: session.appClientId, agentId: session.agentId },
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
        userInput: retryUserMessage,
        finalOutput: '',
        steps: partialSteps,
      }),
    });
    if (result) {
      deps.host.emitAgentRunComplete(resumeInput.sessionId, result);
    }
    return result;
  }
}
