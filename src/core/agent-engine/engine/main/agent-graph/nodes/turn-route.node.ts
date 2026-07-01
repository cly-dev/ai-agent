import type {
  AgentGraphNodeBundle,
  AgentGraphNodeFn,
} from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { logHostToolResolve } from '../../../../../host-bridge/host-tool-resolve-debug.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { resolveAutoOuterPlanSkill } from '../../plan/outer-plan-skill-resolve.util';
import { resolveTurnRoute } from '../../../turn/turn-routing-llm.util';
import type { TurnRouteLlmInput } from '../../../turn/turn-routing.types';
import { finalizeTurnWriteChannel } from '../../../turn/finalize-turn-write-channel.util';
import { buildTurnExecutionContract } from '../../../turn/turn-execution-contract.util';
import type { BuildTurnExecutionContractRequestedSkill } from '../../../turn/turn-execution-contract.types';
import {
  deriveSkillExecutionChannels,
  EMPTY_SKILL_EXECUTION_CHANNELS,
} from '../../../../../workflow/derive-skill-execution-channels.util';
import { loadSkillExecutionChannels } from '../../../../../workflow/load-skill-execution-channels.util';
import {
  applyTurnScopedToolsFromContract,
  bundleFromAllowedRunInput,
  emptyScopedToolsBundle,
  spreadScopedToolsBundle,
} from '../../../turn/turn-scoped-tools.util';
import {
  buildChitchatRoutingDecision,
  finalizeTurnRoutingDecision,
} from '../../../turn/turn-routing.util';
import {
  mergePageContextPreloadedObservations,
} from '../../../../../host-bridge/page-context-usage.util';
import { shouldMaterializePageContextFromUsage } from '../../../../../host-bridge/page-context-execution-policy.util';
import {
  deriveSkillRunnableKind,
  normalizeSkillRunnableCapabilities,
} from '../../../../../skill/skill-runnable.util';
import type { AvailableSkillRow } from '../../../../../skill/skill.types';
import type { AgentRunStep, AgentGraphState } from '../../types/agent-engine.types';

function resolveRequestedSkillRowForTurnRoute(input: {
  requestedSkillId: number | null;
  availableSkills: AvailableSkillRow[];
}): AvailableSkillRow | null {
  if (input.requestedSkillId == null) {
    return null;
  }
  return (
    input.availableSkills.find((skill) => skill.id === input.requestedSkillId) ??
    null
  );
}

function resolveRequestedSkillForContract(input: {
  requestedSkillId: number | null;
  requestedSkillRow: AvailableSkillRow | null;
  requestedSkillCtx: import('../../skill/requested-skill-run.service').RequestedSkillRunContext | null;
}): Omit<BuildTurnExecutionContractRequestedSkill, 'executionChannels'> | null {
  if (input.requestedSkillId == null) {
    return null;
  }
  if (input.requestedSkillRow) {
    return {
      id: input.requestedSkillRow.id,
      name: input.requestedSkillRow.name,
      skillToolIds: input.requestedSkillRow.skillToolIds,
      hostToolIds: input.requestedSkillRow.hostToolIds,
      runnableKind: input.requestedSkillRow.runnableKind,
      workflowId: input.requestedSkillRow.workflowId,
      workflowVersion: input.requestedSkillRow.workflowVersion,
      riskLevel: input.requestedSkillRow.riskLevel,
      config: input.requestedSkillRow.config,
    };
  }
  if (
    input.requestedSkillCtx &&
    input.requestedSkillCtx.skillId === input.requestedSkillId
  ) {
    const caps = normalizeSkillRunnableCapabilities(input.requestedSkillCtx.skill);
    return {
      id: input.requestedSkillCtx.skillId,
      name: input.requestedSkillCtx.skill.name,
      skillToolIds: caps.skillToolIds,
      hostToolIds: caps.hostToolIds,
      runnableKind: deriveSkillRunnableKind(caps),
    };
  }
  return null;
}

async function resolveRequestedSkillExecutionChannels(
  prisma: AgentGraphNodeBundle['deps']['prisma'],
  requestedSkill: Omit<BuildTurnExecutionContractRequestedSkill, 'executionChannels'> | null,
): Promise<import('../../../../../workflow/derive-skill-execution-channels.util').SkillExecutionChannels> {
  if (!requestedSkill) {
    return EMPTY_SKILL_EXECUTION_CHANNELS;
  }
  let workflowId = requestedSkill.workflowId ?? null;
  let workflowVersion = requestedSkill.workflowVersion ?? null;
  if (workflowId == null || workflowId <= 0) {
    const skillRow = await prisma.skill.findUnique({
      where: { id: requestedSkill.id },
      select: { workflowId: true, workflowVersion: true },
    });
    workflowId = skillRow?.workflowId ?? null;
    workflowVersion = skillRow?.workflowVersion ?? workflowVersion;
  }
  if (workflowId != null && workflowId > 0) {
    return loadSkillExecutionChannels(prisma, {
      workflowId,
      workflowVersion,
      skillToolIds: requestedSkill.skillToolIds,
      hostToolIds: requestedSkill.hostToolIds,
    });
  }
  return deriveSkillExecutionChannels({
    nodes: [],
    skillToolIds: requestedSkill.skillToolIds,
    hostToolIds: requestedSkill.hostToolIds,
  });
}

function readIntentStepOutput(
  steps: AgentRunStep[],
): Record<string, unknown> | null {
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const row = steps[i];
    if (row.type !== 'intent') {
      continue;
    }
    if (row.output && typeof row.output === 'object') {
      return row.output as Record<string, unknown>;
    }
  }
  return null;
}

function intentRecallMatchesFromStep(
  intentOutput: Record<string, unknown> | null,
): TurnRouteLlmInput['intentRecallMatches'] {
  const raw = intentOutput?.recallMatches;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const item = row as Record<string, unknown>;
      const id = item.id;
      const label = item.label;
      const score = item.score;
      if (typeof id !== 'number' || typeof label !== 'string') {
        return null;
      }
      return {
        id,
        label,
        score: typeof score === 'number' ? score : 0,
      };
    })
    .filter((row): row is TurnRouteLlmInput['intentRecallMatches'][number] =>
      row != null,
    );
}

export function createTurnRouteNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers } = bundle;
  return async (state) => {
    const stepNum = nextRunStepNumber(state.steps);

    const requestedSkillId = ctx.input.requestedSkillId ?? null;
    const pageContextForRoute =
      state.pageContext ?? ctx.input.pageContext ?? null;

    if (state.intentKind === 'smalltalk') {
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        '正在回复…\n',
        'replace',
      );
      const turnRoutingDecision = finalizeTurnRoutingDecision({
        decision: buildChitchatRoutingDecision({ reason: 'smalltalk_intent' }),
        pageContext: pageContextForRoute,
      });
      const turnExecutionContract = buildTurnExecutionContract({
        routing: turnRoutingDecision,
        userMessage: ctx.input.latestUserMessage,
        toolsEnabled: true,
        requestedSkillId: null,
        requestedSkill: null,
        effectiveWriteChannel: 'none',
        pageHostCandidateId: null,
        pageContext: pageContextForRoute,
      });
      const routeStep: AgentRunStep = {
        step: stepNum,
        type: 'route_plan',
        output: runHelpers.normalizeJsonLike({
          route: turnRoutingDecision.route,
          method: turnRoutingDecision.method,
          reason: turnRoutingDecision.reason,
          routeFallback: true,
          smalltalkIntent: true,
          skillSelect: turnExecutionContract.plan.skillSelect,
          scopedToolsSource: turnExecutionContract.plan.scopedToolsSource,
          pageContextPlan: turnExecutionContract.plan.pageContextPlan,
          skillAlignment: turnExecutionContract.skillAlignment,
        }),
      };
      const stepsWithRoute = [...state.steps, routeStep];
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithRoute,
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: stepsWithRoute,
        turnRoutingDecision,
        turnExecutionContract,
        pageContext: pageContextForRoute,
        preloadedToolObservations: state.preloadedToolObservations ?? [],
        scopedHostTools: [],
        scopedHostLangChainTools: [],
        ...spreadScopedToolsBundle(emptyScopedToolsBundle()),
      };
    }

    deps.sse.emitThink(
      ctx.input.sessionId,
      ctx.input.runId,
      '正在判断本轮任务类型…\n',
      'replace',
    );

    const hostBundle = await runHelpers.loadScopedHostTools(
      ctx.input,
      pageContextForRoute,
      requestedSkillId,
    );
    const scopedHostToolIds = hostBundle.scopedHostTools.map((tool) => tool.id);

    const availableSkills = await deps.skillService.resolveSkillsForOuterPlan({
      agentId: ctx.input.agentId,
      userId: ctx.input.userId,
      appClientId: ctx.input.appClientId,
      scopedTools: state.scopedTools,
      scopedHostToolIds,
      requestedSkillId,
    });

    const autoSkillCandidate =
      scopedHostToolIds.length > 0
        ? resolveAutoOuterPlanSkill({
            availableSkills,
            scopedHostToolIds,
          })
        : null;

    const intentOutput = readIntentStepOutput(state.steps);
    const requestedSkillRow = resolveRequestedSkillRowForTurnRoute({
      requestedSkillId,
      availableSkills,
    });
    const requestedSkillBase = resolveRequestedSkillForContract({
      requestedSkillId,
      requestedSkillRow,
      requestedSkillCtx: ctx.requestedSkillCtx,
    });
    const executionChannels = await resolveRequestedSkillExecutionChannels(
      deps.prisma,
      requestedSkillBase,
    );
    const routeInput: TurnRouteLlmInput = {
      userMessage: ctx.input.latestUserMessage,
      pageContext: pageContextForRoute as Record<string, unknown> | null,
      intentRecallMatches: intentRecallMatchesFromStep(intentOutput),
      availableSkills: availableSkills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
      })),
      availableHostTools: hostBundle.scopedHostTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
      })),
      pageHostSkillCandidate: autoSkillCandidate
        ? {
            id: autoSkillCandidate.skill.id,
            name: autoSkillCandidate.skill.name,
          }
        : null,
      requestedSkill: requestedSkillRow
        ? {
            id: requestedSkillRow.id,
            name: requestedSkillRow.name,
            description: requestedSkillRow.description,
          }
        : null,
      requestedSkillExecutionChannels: executionChannels,
    };

    const llmRoutingDecision = await resolveTurnRoute({
      llmService: deps.llmService,
      promptRegistry: deps.promptRegistry,
      scope: ctx.promptScope,
      routeInput,
    });
    const turnRoutingDecisionRaw = finalizeTurnRoutingDecision({
      decision: llmRoutingDecision,
      pageContext: pageContextForRoute,
    });
    const requestedSkillForContract = requestedSkillBase
      ? { ...requestedSkillBase, executionChannels }
      : null;
    const {
      writeChannel: effectiveWriteChannel,
      routing: turnRoutingDecision,
      skillChannelAnchored,
    } = finalizeTurnWriteChannel({
      routing: turnRoutingDecisionRaw,
      skillChannels: requestedSkillForContract?.executionChannels ?? null,
    });
    const pageContextAppliesBoosted =
      turnRoutingDecision.pageContextApplies &&
      !llmRoutingDecision.pageContextApplies;
    const pageContextRouteCorrected =
      llmRoutingDecision.route !== turnRoutingDecision.route;
    const pageContextTaskKindBoosted =
      turnRoutingDecision.pageContextTaskKind !==
      llmRoutingDecision.pageContextTaskKind;
    const hostMutationIntentBoosted =
      turnRoutingDecision.hostMutationIntent &&
      !llmRoutingDecision.hostMutationIntent;
    const llmWriteChannelCorrected =
      llmRoutingDecision.llmWriteChannel !== effectiveWriteChannel;

    const turnExecutionContract = buildTurnExecutionContract({
      routing: turnRoutingDecision,
      userMessage: ctx.input.latestUserMessage,
      toolsEnabled: true,
      requestedSkillId,
      requestedSkill: requestedSkillForContract,
      effectiveWriteChannel,
      pageHostCandidateId: autoSkillCandidate?.skill.id ?? null,
      pageContext: pageContextForRoute,
    });

    const shouldMaterializePageContext = shouldMaterializePageContextFromUsage(
      turnExecutionContract.plan.pageContextUsage,
    );
    const preloadedFromPageContext = shouldMaterializePageContext
      ? mergePageContextPreloadedObservations(
          state.preloadedToolObservations ?? [],
          pageContextForRoute,
        )
      : state.preloadedToolObservations ?? [];

    logHostToolResolve('turn_route_decision', {
      runId: ctx.input.runId,
      sessionId: ctx.input.sessionId,
      route: turnRoutingDecision.route,
      method: turnRoutingDecision.method,
      reason: turnRoutingDecision.reason,
      suggestedSkillId: turnRoutingDecision.suggestedSkillId,
      pageHostSkillCandidateId: autoSkillCandidate?.skill.id ?? null,
      hostToolNames: hostBundle.scopedHostTools.map((tool) => tool.name),
      pageContextUsage: turnExecutionContract.plan.pageContextUsage,
      pageContextPlan: turnExecutionContract.plan.pageContextPlan,
      pageContextAppliesBoosted,
      pageContextTaskKindBoosted,
      hostMutationIntent: turnRoutingDecision.hostMutationIntent,
      llmHostMutationIntent: llmRoutingDecision.hostMutationIntent,
      hostMutationIntentBoosted,
      pageContextRouteCorrected,
      llmRoute: llmRoutingDecision.route,
      skillAlignment: turnExecutionContract.skillAlignment,
    });

    const routeStep: AgentRunStep = {
      step: stepNum,
      type: 'route_plan',
      output: runHelpers.normalizeJsonLike({
        route: turnRoutingDecision.route,
        method: turnRoutingDecision.method,
        reason: turnRoutingDecision.reason,
        routeFallback: turnRoutingDecision.method !== 'llm',
        suggestedSkillId: turnRoutingDecision.suggestedSkillId,
        pageHostSkillCandidateId: autoSkillCandidate?.skill.id ?? null,
        requestedSkillId,
        skillSelect: turnExecutionContract.plan.skillSelect,
        scopedToolsSource: turnExecutionContract.plan.scopedToolsSource,
        allowHostToolSteps: turnExecutionContract.plan.allowHostToolSteps,
        availableSkillIds: availableSkills.map((skill) => skill.id),
        availableHostToolNames: hostBundle.scopedHostTools.map(
          (tool) => tool.name,
        ),
        pageContextUsage: turnExecutionContract.plan.pageContextUsage,
        pageContextPlan: turnExecutionContract.plan.pageContextPlan,
        pageContextTaskKind: turnRoutingDecision.pageContextTaskKind,
        hostMutationIntent: turnRoutingDecision.hostMutationIntent,
        llmWriteChannel: llmRoutingDecision.llmWriteChannel,
        llmWriteChannelDraft: llmRoutingDecision.llmWriteChannel,
        llmWriteChannelCorrected,
        llmPageContextApplies: llmRoutingDecision.pageContextApplies,
        llmPageContextTaskKind: llmRoutingDecision.llmPageContextTaskKind,
        llmHostMutationIntent: llmRoutingDecision.hostMutationIntent,
        pageContextAppliesBoosted,
        pageContextTaskKindBoosted,
        hostMutationIntentBoosted,
        pageContextRouteCorrected,
        skillChannelAnchored,
        effectiveWriteChannel,
        skillExecutionChannels: executionChannels,
        llmRoute: llmRoutingDecision.route,
        skillAlignment: turnExecutionContract.skillAlignment,
      }),
    };
    const stepsWithRoute = [...state.steps, routeStep];

    if (turnExecutionContract.terminalRespond) {
      const sessionGoa = ctx.getSessionGoa();
      if (
        sessionGoa?.activeTask?.status === 'in_progress' ||
        sessionGoa?.activeTask?.status === 'awaiting_confirmation'
      ) {
        await deps.goaService.abandonActiveTask(ctx.input.sessionId);
        ctx.setSessionGoa(await deps.goaService.getPayload(ctx.input.sessionId));
      }
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithRoute,
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(
        {
          ...state,
          turnRoutingDecision,
          turnExecutionContract,
        },
        stepsWithRoute,
        {
          ...turnExecutionContract.terminalRespond,
          userMessage: ctx.input.latestUserMessage,
        },
      );
    }

    await runHelpers.updateRun(
      ctx.input.runId,
      stepsWithRoute,
      AgentRunStatus.running,
    );

    const intentScopedTools =
      state.intentScopedToolsBundle ??
      bundleFromAllowedRunInput({
        tools: ctx.input.tools,
        langChainTools: ctx.input.langChainTools,
        allowedToolIds: ctx.input.allowedToolIds,
      });
    const activeScopedTools =
      turnRoutingDecision.route === 'direct_answer'
        ? emptyScopedToolsBundle()
        : applyTurnScopedToolsFromContract({
            contract: turnExecutionContract,
            intentScopedTools,
            requestedSkillCtx: ctx.requestedSkillCtx,
          });

    const nextState: AgentGraphState = {
      ...state,
      steps: stepsWithRoute,
      turnRoutingDecision,
      turnExecutionContract,
      pageContext: pageContextForRoute,
      preloadedToolObservations: preloadedFromPageContext,
      scopedHostTools:
        turnRoutingDecision.route === 'direct_answer'
          ? []
          : hostBundle.scopedHostTools,
      scopedHostLangChainTools:
        turnRoutingDecision.route === 'direct_answer'
          ? []
          : hostBundle.scopedHostLangChainTools,
      ...spreadScopedToolsBundle(activeScopedTools),
    };
    return nextState;
  };
}
