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
  routeFromTaskKind,
  writeChannelFromTaskKind,
} from '../../../turn/resolve-turn-task-kind.util';
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
import { buildChitchatRouteDraft } from '../../../turn/turn-routing.util';
import { guardTaskRouteDraftForIntent } from '../../../turn/turn-route-guard.util';
import { mergePageContextPreloadedObservations } from '../../../../../host-bridge/page-context-usage.util';
import { shouldMaterializePageContextFromUsage } from '../../../../../host-bridge/page-context-execution-policy.util';
import {
  deriveSkillRunnableKind,
  normalizeSkillRunnableCapabilities,
} from '../../../../../skill/skill-runnable.util';
import type { AvailableSkillRow } from '../../../../../skill/skill.types';
import type {
  AgentRunStep,
  AgentGraphState,
} from '../../types/agent-engine.types';
import { detectIntentKind as classifyIntentKind } from '../../../../intent-kind.util';
import { loadSmallTalkHints } from '../../../../../intent/smalltalk-hints.util';

/** 从 outerPlan 可用 Skill 列表查找 UI 显式点选的 requestedSkill；未命中时由 resolveRequestedSkillForContract 走 ctx 兜底。 */
function resolveRequestedSkillRowForTurnRoute(input: {
  requestedSkillId: number | null;
  availableSkills: AvailableSkillRow[];
}): AvailableSkillRow | null {
  if (input.requestedSkillId == null) {
    return null;
  }
  return (
    input.availableSkills.find(
      (skill) => skill.id === input.requestedSkillId,
    ) ?? null
  );
}

/**
 * 组装契约所需的 Skill 快照：优先 DB 行，其次 run 上下文（会话续跑时 skill 可能未出现在 outerPlan 列表）。
 */
function resolveRequestedSkillForContract(input: {
  requestedSkillId: number | null;
  requestedSkillRow: AvailableSkillRow | null;
  requestedSkillCtx:
    | import('../../skill/requested-skill-run.service').RequestedSkillRunContext
    | null;
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
    const caps = normalizeSkillRunnableCapabilities(
      input.requestedSkillCtx.skill,
    );
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

/** 供 Route LLM 判断 analyze vs mutation；显式 Skill 的 workflow 通道也是 reconcile 锚定依据。 */
async function resolveRequestedSkillExecutionChannels(
  prisma: AgentGraphNodeBundle['deps']['prisma'],
  requestedSkill: Omit<
    BuildTurnExecutionContractRequestedSkill,
    'executionChannels'
  > | null,
): Promise<
  import('../../../../../workflow/derive-skill-execution-channels.util').SkillExecutionChannels
> {
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
    .filter(
      (row): row is TurnRouteLlmInput['intentRecallMatches'][number] =>
        row != null,
    );
}

/**
 * turn_route 节点：产出本轮 TurnExecutionContract（图状态唯一路由真源）。
 *
 * 流水线：smalltalk 短路 | Route LLM → routeDraft → buildTurnExecutionContract
 * → 由 taskKind 派生 route/writeChannel → 写 route_plan step 供观测与下游 plan/tools。
 */
export function createTurnRouteNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers } = bundle;
  return async (state) => {
    const stepNum = nextRunStepNumber(state.steps);

    const requestedSkillId = ctx.input.requestedSkillId ?? null;
    const pageContextForRoute =
      state.pageContext ?? ctx.input.pageContext ?? null;

    const intentKind =
      state.intentKind === 'smalltalk'
        ? 'smalltalk'
        : classifyIntentKind(ctx.input.latestUserMessage, loadSmallTalkHints());

    // 寒暄不走 Route LLM（省一次调用）；仍走同一 contract 构建，保证下游只读 taskKind。
    if (intentKind === 'smalltalk') {
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        '正在回复…\n',
        'replace',
      );
      const routeDraft = buildChitchatRouteDraft({
        reason: 'smalltalk_intent',
      });
      const turnExecutionContract = buildTurnExecutionContract({
        routeDraft,
        userMessage: ctx.input.latestUserMessage,
        toolsEnabled: true,
        requestedSkillId: null,
        requestedSkill: null,
        pageHostCandidateId: null,
        pageContext: pageContextForRoute,
      });
      const contract = turnExecutionContract;
      const route = routeFromTaskKind(contract.taskKind);
      const routeStep: AgentRunStep = {
        step: stepNum,
        type: 'route_plan',
        output: runHelpers.normalizeJsonLike({
          route,
          method: contract.routeMeta.method,
          reason: contract.routeMeta.reason,
          routeFallback: true,
          smalltalkIntent: true,
          taskKind: contract.taskKind,
          skillSelect: contract.plan.skillSelect,
          scopedToolsSource: contract.plan.scopedToolsSource,
          pageContextPlan: contract.plan.pageContextPlan,
          skillAlignment: contract.skillAlignment,
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
        turnExecutionContract,
        pageContext: pageContextForRoute,
        intentKind: 'smalltalk',
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

    // 当前页 scoped host 工具能唯一对应一个 Skill 时，作为 Route LLM 的 on_page 候选。
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
    // Route LLM 输入（prompt: agent.turn_route）；只产出 draft，不做最终契约。
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

    const routeDraft = guardTaskRouteDraftForIntent({
      intentKind,
      routeDraft: await resolveTurnRoute({
        llmService: deps.llmService,
        promptRegistry: deps.promptRegistry,
        scope: ctx.promptScope,
        routeInput,
      }),
    });
    const requestedSkillForContract = requestedSkillBase
      ? { ...requestedSkillBase, executionChannels }
      : null;

    // reconcileTurnIntent 在 buildTurnExecutionContract 内：pageContext 纠偏 + 显式 Skill 通道锚定 → taskKind。
    const turnExecutionContract = buildTurnExecutionContract({
      routeDraft,
      userMessage: ctx.input.latestUserMessage,
      toolsEnabled: true,
      requestedSkillId,
      requestedSkill: requestedSkillForContract,
      pageHostCandidateId: autoSkillCandidate?.skill.id ?? null,
      pageContext: pageContextForRoute,
    });
    const contract = turnExecutionContract;
    const routeMeta = contract.routeMeta;
    // route / writeChannel 不由 LLM 直出，均由 reconcile 后的 taskKind 派生（避免双真源）。
    const route = routeFromTaskKind(contract.taskKind);
    const writeChannel = writeChannelFromTaskKind(contract.taskKind);

    // 以下 *Boosted / *Corrected 仅用于 route_plan 观测，对照 LLM draft 与 reconcile 后契约。
    const skillChannelAnchored = contract.skillChannelAnchored;
    const pageContextAppliesBoosted =
      routeMeta.pageContextApplies && !routeDraft.pageContextApplies;
    const pageContextRouteCorrected = routeDraft.route !== route;
    const pageContextTaskKindBoosted =
      routeMeta.pageContextTaskKind !== 'none' &&
      routeDraft.llmPageContextTaskKind === 'none';
    const writeChannelCorrected = routeDraft.draftWriteChannel !== writeChannel;

    // 内联 pageContext 将作为 observation 预加载，供 plan/summarize 免再调 HTTP 读接口。
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
      route,
      method: routeMeta.method,
      reason: routeMeta.reason,
      suggestedSkillId: routeMeta.suggestedSkillId,
      pageHostSkillCandidateId: autoSkillCandidate?.skill.id ?? null,
      hostToolNames: hostBundle.scopedHostTools.map((tool) => tool.name),
      pageContextUsage: turnExecutionContract.plan.pageContextUsage,
      pageContextPlan: turnExecutionContract.plan.pageContextPlan,
      pageContextAppliesBoosted,
      pageContextTaskKindBoosted,
      pageContextRouteCorrected,
      llmRoute: routeDraft.route,
      taskKind: contract.taskKind,
      writeChannel,
      skillAlignment: turnExecutionContract.skillAlignment,
    });

    const routeStep: AgentRunStep = {
      step: stepNum,
      type: 'route_plan',
      // 同时保留 llm* 与最终字段，便于 run 排查 reconcile 是否生效。
      output: runHelpers.normalizeJsonLike({
        route,
        method: routeMeta.method,
        reason: routeMeta.reason,
        routeFallback: routeMeta.method !== 'llm',
        suggestedSkillId: routeMeta.suggestedSkillId,
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
        pageContextTaskKind: routeMeta.pageContextTaskKind,
        routeDraftWriteChannel: routeDraft.draftWriteChannel,
        writeChannelCorrected,
        llmPageContextApplies: routeDraft.pageContextApplies,
        llmPageContextTaskKind: routeDraft.llmPageContextTaskKind,
        llmReadDeliverable: routeDraft.readDeliverable,
        readDeliverable: routeMeta.readDeliverable,
        pageContextAppliesBoosted,
        pageContextTaskKindBoosted,
        pageContextRouteCorrected,
        skillChannelAnchored,
        writeChannel,
        taskKind: turnExecutionContract.taskKind,
        skillExecutionChannels: executionChannels,
        llmRoute: routeDraft.route,
        skillAlignment: turnExecutionContract.skillAlignment,
      }),
    };
    const stepsWithRoute = [...state.steps, routeStep];

    // direct_answer 等终端路径：放弃进行中的 GOA 任务后直接 respond，不再进入 plan。
    if (turnExecutionContract.terminalRespond) {
      const sessionGoa = ctx.getSessionGoa();
      if (
        sessionGoa?.activeTask?.status === 'in_progress' ||
        sessionGoa?.activeTask?.status === 'awaiting_confirmation'
      ) {
        await deps.goaService.abandonActiveTask(ctx.input.sessionId);
        ctx.setSessionGoa(
          await deps.goaService.getPayload(ctx.input.sessionId),
        );
      }
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithRoute,
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(
        {
          ...state,
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
      route === 'direct_answer'
        ? // direct_answer 清空 HTTP/host 工具面，避免闲聊误调工具。
          emptyScopedToolsBundle()
        : applyTurnScopedToolsFromContract({
            // 按 contract.plan（skillSelect / scopedToolsSource）收窄 intent 阶段工具面。
            contract: turnExecutionContract,
            intentScopedTools,
            requestedSkillCtx: ctx.requestedSkillCtx,
          });

    const nextState: AgentGraphState = {
      ...state,
      steps: stepsWithRoute,
      turnExecutionContract,
      pageContext: pageContextForRoute,
      preloadedToolObservations: preloadedFromPageContext,
      scopedHostTools:
        route === 'direct_answer' ? [] : hostBundle.scopedHostTools,
      scopedHostLangChainTools:
        route === 'direct_answer' ? [] : hostBundle.scopedHostLangChainTools,
      ...spreadScopedToolsBundle(activeScopedTools),
    };
    return nextState;
  };
}
