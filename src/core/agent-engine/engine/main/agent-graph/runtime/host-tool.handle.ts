import {
  dispatchHostActionSse,
  type HostToolDecisionDefinition,
} from '../../../../../host-bridge';
import { buildHostToolSkippedObservation } from '../../host-tool/host-tool-plan.util';
import {
  buildHostToolRequiredMissedStep,
  buildHostToolRunStepFromPlanHandle,
} from '../../host-tool/host-tool-run-step.util';
import {
  evaluateHostToolPostLlm,
  evaluateHostToolPreLlmSkip,
  finalizeHostToolPlanStep,
  type HostToolPlanStepHandleResult,
  type HostToolStepSkipReason,
} from '../../host-tool/host-tool-llm.util';
import {
  applyPlanDraftToWriteToolCalls,
  resolvePlanSubmitTextForWrite,
} from '../../plan-present/plan-draft-reply.util';
import {
  resolveHostToolCallsWithPlanDraft,
} from '../../plan-present/plan-draft-host-tool.util';
import { resolvePlanHostFillCalls } from '../../plan-present/plan-host-fill.util';
import { resolveTurnExecutionContract } from '../../../turn/turn-execution-contract.util';
import { allToolObservations } from '../../../graph-tool-observations.util';
import type { PlanSyncSite } from '../../plan/plan-sync.util';
import type { TaskPlanAdvanceResult, TaskPlanStep } from '../../plan/task-plan.types';
import type { AgentGraphState, AgentRunStep, GraphToolCall, ToolObservation } from '../../types/agent-engine.types';
import type { AgentGraphDeps, AgentGraphRunContext } from '../types/graph.types';
import type { AgentGraphRunHelpers } from './run.helpers';
import type { AgentGraphSkillFrameHelpers } from './skill-frame.util';
import type { AgentGraphDecisionHelpers } from './decision.util';

export type HostToolAfterLlmResult =
  | { kind: 'continue' }
  | { kind: 'state'; state: AgentGraphState };

export interface AgentGraphHostToolHandleHelpers {
  handleHostToolPreLlmSkip: (input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    llmStepNumber: number;
    nextIteration: number;
  }) => AgentGraphState | null;
  processHostToolAfterLlmDecision: (input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep | null;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    observationsForLlm: ToolObservation[];
    llmStepNumber: number;
    nextIteration: number;
    steps: AgentRunStep[];
    httpCalls: GraphToolCall[];
    hostCalls: GraphToolCall[];
    toolCallsFromLlm: GraphToolCall[];
  }) => HostToolAfterLlmResult;
  applyHostToolPlanStepHandle: (
    graphState: AgentGraphState,
    input: {
      handle: HostToolPlanStepHandleResult;
      planStepId: string;
      steps: AgentRunStep[];
      nextIteration: number;
      httpCalls: GraphToolCall[];
      sessionId: string;
      runId: number;
      warnMessage?: string;
    },
    withPlanSyncStep: AgentGraphSkillFrameHelpers['withPlanSyncStep'],
  ) => AgentGraphState;
  tryDispatchHostToolFromPlanDraft: (input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    observationsForLlm: ToolObservation[];
    llmStepNumber: number;
    nextIteration: number;
    steps: AgentRunStep[];
    httpCalls?: GraphToolCall[];
    llmHostCalls?: GraphToolCall[];
    reason?: string;
  }) => AgentGraphState | null;
}

export function applyHostToolPlanStepHandle(
  deps: AgentGraphDeps,
  skillFrame: AgentGraphSkillFrameHelpers,
  graphState: AgentGraphState,
  input: {
    handle: HostToolPlanStepHandleResult;
    planStepId: string;
    steps: AgentRunStep[];
    nextIteration: number;
    httpCalls: GraphToolCall[];
    sessionId: string;
    runId: number;
    warnMessage?: string;
  },
  withPlanSyncStep: AgentGraphSkillFrameHelpers['withPlanSyncStep'],
): AgentGraphState {
  if (input.warnMessage) {
    deps.logger.warn(input.warnMessage);
  }
  if (input.handle.ssePayload) {
    dispatchHostActionSse(
      (sessionId, envelope) =>
        deps.runSseGateway.emitHostAction(
          sessionId,
          input.runId,
          envelope.payload,
        ),
      input.sessionId,
      input.handle.ssePayload,
    );
  }
  const hostToolRunStep = buildHostToolRunStepFromPlanHandle({
    existingSteps: input.steps,
    handle: input.handle,
    planStepId: input.planStepId,
    pageScope: graphState.pageContext?.page ?? null,
  });
  const stepsWithHostTool = [...input.steps, hostToolRunStep];
  let nextState: AgentGraphState = {
    ...graphState,
    iteration: input.nextIteration,
    steps: stepsWithHostTool,
    toolObservations: [
      ...graphState.toolObservations,
      ...input.handle.observations,
    ],
    taskPlan: input.handle.planAdvance.updatedPlan,
    pendingToolCalls: input.httpCalls,
    pendingRespond: null,
  };
  nextState = withPlanSyncStep(
    nextState,
    input.handle.planAdvance,
    input.planStepId,
    'llm',
  );
  return nextState;
}

export function tryDispatchHostToolFromPlanDraft(
  deps: AgentGraphDeps,
  runHelpers: AgentGraphRunHelpers,
  hostToolHandle: Pick<AgentGraphHostToolHandleHelpers, 'applyHostToolPlanStepHandle'>,
  skillFrame: AgentGraphSkillFrameHelpers,
  decision: AgentGraphDecisionHelpers,
  ctx: AgentGraphRunContext,
  input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    observationsForLlm: ToolObservation[];
    llmStepNumber: number;
    nextIteration: number;
    steps: AgentRunStep[];
    httpCalls?: GraphToolCall[];
    llmHostCalls?: GraphToolCall[];
    reason?: string;
  },
): AgentGraphState | null {
  const {
    graphState,
    pendingHostStep,
    hostToolsForPrompt,
    observationsForLlm,
    llmStepNumber,
    nextIteration,
    steps,
    httpCalls = [],
    llmHostCalls,
    reason = 'plan_host_tool_from_draft',
  } = input;
  if (!graphState.taskPlan) {
    return null;
  }
  const contract = resolveTurnExecutionContract(
    graphState,
    undefined,
    deps.logger,
  );
  if (!contract.plan.allowHostToolAutoDispatch) {
    return null;
  }
  const hostCalls = resolvePlanHostFillCalls({
    taskPlan: graphState.taskPlan,
    observations: observationsForLlm,
    pendingHostStep,
    hostToolsForPrompt,
  });
  if (hostCalls.length === 0) {
    return null;
  }
  const postLlmOutcome = evaluateHostToolPostLlm({
    pendingHostStep,
    taskPlan: graphState.taskPlan,
    pageContext: graphState.pageContext,
    hostCalls,
    httpCalls,
    hasToolCalls: hostCalls.length > 0,
    scopedHostTools: graphState.scopedHostTools ?? [],
  });
  if (postLlmOutcome.action !== 'dispatch') {
    return null;
  }
  const handled = finalizeHostToolPlanStep({
    taskPlan: graphState.taskPlan,
    planStepId: postLlmOutcome.planStepId,
    hostCalls,
    pageContext: graphState.pageContext,
    runId: ctx.input.runId,
    turnId: ctx.input.turnId,
  });
  if (!handled) {
    return null;
  }
  const draftStep: AgentRunStep = {
    step: llmStepNumber,
    type: 'llm',
    output: runHelpers.normalizeJsonLike({
      reason,
      toolCalls: hostCalls,
      taskPlanTrace: decision.buildTaskPlanTraceForLlmStep(graphState.taskPlan),
    }),
  };
  return hostToolHandle.applyHostToolPlanStepHandle(
    graphState,
    {
      handle: handled,
      planStepId: postLlmOutcome.planStepId,
      steps: [...steps, draftStep],
      nextIteration,
      httpCalls,
      sessionId: ctx.input.sessionId,
      runId: ctx.input.runId,
    },
    skillFrame.withPlanSyncStep,
  );
}

function hostToolPostLlmWarnMessage(
  input: {
    action: 'skip' | 'dispatch';
    reason?: HostToolStepSkipReason;
    runId: number;
    llmStepNumber: number;
    planStepId: string;
    hostCalls?: GraphToolCall[];
    httpCalls?: GraphToolCall[];
  },
): string | undefined {
  if (input.action !== 'skip') {
    return undefined;
  }
  if (input.reason === 'no_host_tool_calls') {
    return `llm plan host_tool step skipped without toolCalls runId=${input.runId} step=${input.llmStepNumber} planStep=${input.planStepId}`;
  }
  if (input.reason === 'unexpected_http_tool_calls') {
    return `host_tool plan step skipped: unexpected HTTP tool calls runId=${input.runId} step=${input.llmStepNumber} planStep=${input.planStepId} httpTools=${input.httpCalls?.map((call) => call.name).join(',') ?? ''}`;
  }
  return `host_tool calls not dispatched runId=${input.runId} step=${input.llmStepNumber} planStep=${input.planStepId} reason=${input.reason} calls=${input.hostCalls?.map((call) => call.name).join(',') ?? ''}`;
}

export function handleHostToolPreLlmSkip(
  deps: AgentGraphDeps,
  runHelpers: AgentGraphRunHelpers,
  hostToolHandle: Pick<AgentGraphHostToolHandleHelpers, 'applyHostToolPlanStepHandle'>,
  skillFrame: AgentGraphSkillFrameHelpers,
  ctx: AgentGraphRunContext,
  input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    llmStepNumber: number;
    nextIteration: number;
  },
): AgentGraphState | null {
  const { graphState, pendingHostStep, hostToolsForPrompt, llmStepNumber, nextIteration } =
    input;
  if (!graphState.taskPlan) {
    return null;
  }
  const contract = resolveTurnExecutionContract(
    graphState,
    undefined,
    deps.logger,
  );
  if (pendingHostStep && !contract.plan.allowHostToolLlmDispatch) {
    const handled = finalizeHostToolPlanStep({
      taskPlan: graphState.taskPlan,
      planStepId: pendingHostStep.id,
      skipReason: 'turn_contract_host_tool_blocked',
      pageContext: graphState.pageContext,
      runId: ctx.input.runId,
      turnId: ctx.input.turnId,
    });
    if (!handled) {
      return null;
    }
    const skipStep: AgentRunStep = {
      step: llmStepNumber,
      type: 'llm',
      output: runHelpers.normalizeJsonLike({
        skipped: true,
        reason: 'turn_contract_host_tool_blocked',
        planStepId: pendingHostStep.id,
      }),
    };
    return hostToolHandle.applyHostToolPlanStepHandle(
      graphState,
      {
        handle: handled,
        planStepId: pendingHostStep.id,
        steps: [...graphState.steps, skipStep],
        nextIteration,
        httpCalls: [],
        sessionId: ctx.input.sessionId,
        runId: ctx.input.runId,
        warnMessage: `host_tool blocked by turn contract runId=${ctx.input.runId} planStep=${pendingHostStep.id}`,
      },
      skillFrame.withPlanSyncStep,
    );
  }
  const preLlmSkipReason = evaluateHostToolPreLlmSkip({
    pendingHostStep,
    taskPlan: graphState.taskPlan,
    pageContext: graphState.pageContext,
    hostToolsForPrompt,
    scopedHostTools: graphState.scopedHostTools ?? [],
  });
  if (!preLlmSkipReason) {
    return null;
  }
  if (preLlmSkipReason === 'required_host_tool_missed') {
    const skipStep: AgentRunStep = {
      step: llmStepNumber,
      type: 'llm',
      output: runHelpers.normalizeJsonLike({
        reason: preLlmSkipReason,
        planStepId: pendingHostStep.id,
      }),
    };
    const hostToolStep = buildHostToolRequiredMissedStep({
      existingSteps: [...graphState.steps, skipStep],
      planStepId: pendingHostStep.id,
      pageScope: graphState.pageContext?.page ?? null,
      skipReason: preLlmSkipReason,
    });
    return {
      ...graphState,
      iteration: nextIteration,
      steps: [...graphState.steps, skipStep, hostToolStep],
      toolObservations: [
        ...graphState.toolObservations,
        buildHostToolSkippedObservation({
          planStepId: pendingHostStep.id,
          reason: preLlmSkipReason,
        }),
      ],
      pendingToolCalls: [],
      pendingRespond: null,
    };
  }
  const handled = finalizeHostToolPlanStep({
    taskPlan: graphState.taskPlan,
    planStepId: pendingHostStep.id,
    skipReason: preLlmSkipReason,
    pageContext: graphState.pageContext,
    runId: ctx.input.runId,
    turnId: ctx.input.turnId,
  });
  if (!handled) {
    return null;
  }
  const skipStep: AgentRunStep = {
    step: llmStepNumber,
    type: 'llm',
    output: runHelpers.normalizeJsonLike({
      skipped: true,
      reason: preLlmSkipReason,
      planStepId: pendingHostStep.id,
    }),
  };
  return hostToolHandle.applyHostToolPlanStepHandle(
    graphState,
    {
      handle: handled,
      planStepId: pendingHostStep.id,
      steps: [...graphState.steps, skipStep],
      nextIteration,
      httpCalls: [],
      sessionId: ctx.input.sessionId,
      runId: ctx.input.runId,
      warnMessage: `host_tool plan step skipped before llm runId=${ctx.input.runId} planStep=${pendingHostStep.id} reason=${preLlmSkipReason}`,
    },
    skillFrame.withPlanSyncStep,
  );
}

export function processHostToolAfterLlmDecision(
  deps: AgentGraphDeps,
  hostToolHandle: Pick<AgentGraphHostToolHandleHelpers, 'applyHostToolPlanStepHandle'>,
  skillFrame: AgentGraphSkillFrameHelpers,
  ctx: AgentGraphRunContext,
  input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep | null;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    observationsForLlm: ToolObservation[];
    llmStepNumber: number;
    nextIteration: number;
    steps: AgentRunStep[];
    httpCalls: GraphToolCall[];
    hostCalls: GraphToolCall[];
    toolCallsFromLlm: GraphToolCall[];
  },
): HostToolAfterLlmResult {
  const {
    graphState,
    pendingHostStep,
    hostToolsForPrompt,
    observationsForLlm,
    llmStepNumber,
    nextIteration,
    steps,
    httpCalls,
    hostCalls: initialHostCalls,
    toolCallsFromLlm,
  } = input;
  let hostCalls = initialHostCalls;
  if (pendingHostStep && graphState.taskPlan) {
    hostCalls = resolveHostToolCallsWithPlanDraft({
      taskPlan: graphState.taskPlan,
      pendingHostStep,
      hostToolsForPrompt,
      observations: observationsForLlm,
      artifactBlocks:
        deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId) ?? null,
      llmHostCalls: hostCalls,
    });
  }
  const postLlmOutcome = evaluateHostToolPostLlm({
    pendingHostStep,
    taskPlan: graphState.taskPlan,
    pageContext: graphState.pageContext,
    hostCalls,
    httpCalls,
    hasToolCalls: toolCallsFromLlm.length > 0,
    scopedHostTools: graphState.scopedHostTools ?? [],
  });
  if (postLlmOutcome.action === 'required_missed') {
    const hostToolStep = buildHostToolRequiredMissedStep({
      existingSteps: steps,
      planStepId: postLlmOutcome.planStepId,
      pageScope: graphState.pageContext?.page ?? null,
      skipReason: postLlmOutcome.reason,
      hostCalls: postLlmOutcome.hostCalls,
    });
    return {
      kind: 'state',
      state: {
        ...graphState,
        iteration: nextIteration,
        steps: [...steps, hostToolStep],
        toolObservations: [
          ...graphState.toolObservations,
          buildHostToolSkippedObservation({
            planStepId: postLlmOutcome.planStepId,
            reason: postLlmOutcome.reason,
            hostCalls: postLlmOutcome.hostCalls,
            httpCalls: postLlmOutcome.httpCalls,
          }),
        ],
        pendingToolCalls: httpCalls,
        pendingRespond: null,
      },
    };
  }
  if (postLlmOutcome.action === 'none' || !graphState.taskPlan) {
    return { kind: 'continue' };
  }
  const handled =
    postLlmOutcome.action === 'dispatch'
      ? finalizeHostToolPlanStep({
          taskPlan: graphState.taskPlan,
          planStepId: postLlmOutcome.planStepId,
          hostCalls: postLlmOutcome.hostCalls,
          pageContext: graphState.pageContext,
          runId: ctx.input.runId,
          turnId: ctx.input.turnId,
        })
      : finalizeHostToolPlanStep({
          taskPlan: graphState.taskPlan,
          planStepId: postLlmOutcome.planStepId,
          skipReason: postLlmOutcome.reason,
          hostCalls: postLlmOutcome.hostCalls,
          httpCalls: postLlmOutcome.httpCalls,
          pageContext: graphState.pageContext,
          runId: ctx.input.runId,
          turnId: ctx.input.turnId,
        });
  if (!handled) {
    return { kind: 'continue' };
  }
  const stateAfterHost = hostToolHandle.applyHostToolPlanStepHandle(
    graphState,
    {
      handle: handled,
      planStepId: postLlmOutcome.planStepId,
      steps,
      nextIteration,
      httpCalls,
      sessionId: ctx.input.sessionId,
      runId: ctx.input.runId,
      warnMessage:
        postLlmOutcome.action === 'skip'
          ? hostToolPostLlmWarnMessage({
              action: 'skip',
              reason: postLlmOutcome.reason,
              runId: ctx.input.runId,
              llmStepNumber,
              planStepId: postLlmOutcome.planStepId,
              hostCalls: postLlmOutcome.hostCalls,
              httpCalls: postLlmOutcome.httpCalls,
            })
          : undefined,
    },
    skillFrame.withPlanSyncStep,
  );
  if (httpCalls.length === 0) {
    return { kind: 'state', state: stateAfterHost };
  }
  return {
    kind: 'state',
    state: {
      ...stateAfterHost,
      pendingToolCalls: applyPlanDraftToWriteToolCalls(
        httpCalls,
        stateAfterHost.taskPlan,
        stateAfterHost.scopedTools,
        resolvePlanSubmitTextForWrite({
          observations: allToolObservations(stateAfterHost),
          artifactBlocks:
            deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId) ??
            null,
          scopedTools: stateAfterHost.scopedTools,
        }),
      ),
    },
  };
}

export function createAgentGraphHostToolHandleHelpers(
  deps: AgentGraphDeps,
  runHelpers: AgentGraphRunHelpers,
  skillFrame: AgentGraphSkillFrameHelpers,
  decision: AgentGraphDecisionHelpers,
  ctx: AgentGraphRunContext,
): AgentGraphHostToolHandleHelpers {
  const apply = (
    graphState: AgentGraphState,
    handleInput: Parameters<AgentGraphHostToolHandleHelpers['applyHostToolPlanStepHandle']>[1],
    withPlanSyncStep: AgentGraphSkillFrameHelpers['withPlanSyncStep'],
  ) => applyHostToolPlanStepHandle(deps, skillFrame, graphState, handleInput, withPlanSyncStep);
  return {
    handleHostToolPreLlmSkip: (input) =>
      handleHostToolPreLlmSkip(deps, runHelpers, { applyHostToolPlanStepHandle: apply }, skillFrame, ctx, input),
    processHostToolAfterLlmDecision: (input) =>
      processHostToolAfterLlmDecision(deps, { applyHostToolPlanStepHandle: apply }, skillFrame, ctx, input),
    applyHostToolPlanStepHandle: apply,
    tryDispatchHostToolFromPlanDraft: (input) =>
      tryDispatchHostToolFromPlanDraft(deps, runHelpers, { applyHostToolPlanStepHandle: apply }, skillFrame, decision, ctx, input),
  };
}
