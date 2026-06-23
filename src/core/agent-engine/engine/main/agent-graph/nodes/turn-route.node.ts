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
import { buildTurnExecutionContract } from '../../../turn/turn-execution-contract.util';
import {
  normalizeSkillRunnableCapabilities,
  skillIsHostOnlySkill,
  deriveSkillRunnableKind,
} from '../../../../../skill/skill-runnable.util';
import type { AvailableSkillRow } from '../../../../../skill/skill.types';
import type { AgentRunStep, AgentGraphState } from '../../types/agent-engine.types';
import type { RequestedSkillRunContext } from '../../skill/requested-skill-run.service';

function resolveRequestedSkillRowForTurnRoute(input: {
  requestedSkillId: number | null;
  availableSkills: AvailableSkillRow[];
  requestedSkillCtx: RequestedSkillRunContext | null;
}): AvailableSkillRow | null {
  if (input.requestedSkillId == null) {
    return null;
  }
  const fromAvailable = input.availableSkills.find(
    (skill) => skill.id === input.requestedSkillId,
  );
  if (fromAvailable) {
    return fromAvailable;
  }
  if (
    input.requestedSkillCtx &&
    input.requestedSkillCtx.skillId === input.requestedSkillId
  ) {
    const capabilities = normalizeSkillRunnableCapabilities(
      input.requestedSkillCtx.skill,
    );
    return {
      id: input.requestedSkillCtx.skillId,
      name: input.requestedSkillCtx.skill.name,
      description: input.requestedSkillCtx.skill.description,
      skillToolIds: capabilities.skillToolIds,
      hostToolIds: capabilities.hostToolIds,
      runnableKind: deriveSkillRunnableKind(capabilities),
    } as AvailableSkillRow;
  }
  return null;
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

    deps.sse.emitThink(
      ctx.input.sessionId,
      ctx.input.runId,
      '正在判断本轮任务类型…\n',
      'replace',
    );

    const requestedSkillId = ctx.input.requestedSkillId ?? null;
    const pageContextForRoute =
      state.pageContext ?? ctx.input.pageContext ?? null;
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
      requestedSkillCtx: ctx.requestedSkillCtx,
    });
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
    };

    const turnRoutingDecision = await resolveTurnRoute({
      llmService: deps.llmService,
      promptRegistry: deps.promptRegistry,
      scope: ctx.promptScope,
      routeInput,
    });

    const requestedSkillIsHostOnly =
      requestedSkillRow != null
        ? skillIsHostOnlySkill(
            normalizeSkillRunnableCapabilities({
              skillToolIds:
                'skillToolIds' in requestedSkillRow
                  ? requestedSkillRow.skillToolIds
                  : undefined,
              hostToolIds:
                'hostToolIds' in requestedSkillRow
                  ? requestedSkillRow.hostToolIds
                  : undefined,
            }),
          ) ||
          ('runnableKind' in requestedSkillRow &&
            requestedSkillRow.runnableKind === 'host')
        : false;

    const turnExecutionContract = buildTurnExecutionContract({
      routing: turnRoutingDecision,
      userMessage: ctx.input.latestUserMessage,
      toolsEnabled: true,
      requestedSkillId,
      requestedSkillIsHostOnly,
      pageHostCandidateId: autoSkillCandidate?.skill.id ?? null,
    });

    logHostToolResolve('turn_route_decision', {
      runId: ctx.input.runId,
      sessionId: ctx.input.sessionId,
      route: turnRoutingDecision.route,
      method: turnRoutingDecision.method,
      reason: turnRoutingDecision.reason,
      suggestedSkillId: turnRoutingDecision.suggestedSkillId,
      pageHostSkillCandidateId: autoSkillCandidate?.skill.id ?? null,
      hostToolNames: hostBundle.scopedHostTools.map((tool) => tool.name),
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
        allowHostToolSteps: turnExecutionContract.plan.allowHostToolSteps,
        availableSkillIds: availableSkills.map((skill) => skill.id),
        availableHostToolNames: hostBundle.scopedHostTools.map(
          (tool) => tool.name,
        ),
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

    const nextState: AgentGraphState = {
      ...state,
      steps: stepsWithRoute,
      turnRoutingDecision,
      turnExecutionContract,
      pageContext: pageContextForRoute,
      scopedHostTools: hostBundle.scopedHostTools,
      scopedHostLangChainTools: hostBundle.scopedHostLangChainTools,
    };
    return nextState;
  };
}
