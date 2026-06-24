import { expandPendingSkillStepIfNeeded } from '../../skill/skill-frame-expand.util';
import { resolveSkillContextFromPlan } from '../../plan/plan-stack.util';
import { enrichPlanStepsWithHostTools } from '../../host-tool/host-tool-plan.util';
import { skipPendingHostToolStepsByContract } from '../../host-tool/host-tool-llm.util';
import { pageContextEntityIdFromGraphState } from '../../../turn/turn-execution-contract.util';
import { resolveTurnExecutionContract } from '../../../turn/turn-execution-contract.util';
import { isPageContextOuterPlanActive } from '../../../../../host-bridge/page-context-execution-policy.util';
import { syncTaskPlanBeforeReAct, toPlanSyncAgentStep } from '../../plan/plan-sync.util';
import { planObservationBucketsFromState, planRunContextFromState } from '../../plan/plan-observation-scope.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import type { PlanSyncSite } from '../../plan/plan-sync.util';
import type { TaskPlanAdvanceResult } from '../../plan/task-plan.types';
import type { AgentGraphState } from '../../types/agent-engine.types';
import type { AgentGraphDeps, AgentGraphRunContext } from '../types/graph.types';
import type { AgentGraphRunHelpers } from './run.helpers';

export interface AgentGraphSkillFrameHelpers {
  applySkillFrameContext: (state: AgentGraphState) => Promise<AgentGraphState>;
  withPlanSyncStep: (
    graphState: AgentGraphState,
    planAdvance: TaskPlanAdvanceResult | null,
    fromStepId: string | null,
    site: PlanSyncSite,
  ) => AgentGraphState;
  prepareReActPlanState: (state: AgentGraphState) => Promise<{
    state: AgentGraphState;
    planAdvance: TaskPlanAdvanceResult | null;
    fromStepId: string | null;
  }>;
}

export function createAgentGraphSkillFrameHelpers(
  deps: AgentGraphDeps,
  ctx: AgentGraphRunContext,
  runHelpers: AgentGraphRunHelpers,
): AgentGraphSkillFrameHelpers {
  const applySkillFrameContext = async (
    state: AgentGraphState,
  ): Promise<AgentGraphState> => {
    if (!state.taskPlan) {
      return state;
    }
    const pageContext = state.pageContext ?? ctx.input.pageContext ?? null;
    const pendingStepId = state.taskPlan.pendingStepIds[0] ?? null;
    const pendingStep = pendingStepId
      ? state.taskPlan.steps.find((row) => row.id === pendingStepId)
      : null;
    const skillIdForHost =
      state.activeSkillId ??
      (pendingStep?.kind === 'skill' && pendingStep.skillId != null
        ? pendingStep.skillId
        : null) ??
      ctx.input.requestedSkillId ??
      null;
    const hostBundle = await runHelpers.loadScopedHostTools(
      ctx.input,
      pageContext,
      skillIdForHost,
    );
    const availableHostTools = hostBundle.scopedHostTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
    const contract = resolveTurnExecutionContract(state, undefined, deps.logger);
    if (isPageContextOuterPlanActive(contract.plan.pageContextPlan)) {
      return {
        ...state,
        scopedHostTools: hostBundle.scopedHostTools,
        scopedHostLangChainTools: hostBundle.scopedHostLangChainTools,
      };
    }
    const expanded = await expandPendingSkillStepIfNeeded({
      plan: state.taskPlan,
      scopedTools: state.scopedTools,
      toolBuildCtx: ctx.input.toolBuildCtx,
      skillService: deps.skillService,
      llmService: deps.llmService,
      promptRegistry: deps.promptRegistry,
      scope: ctx.promptScope,
      agentId: ctx.input.agentId,
      userId: ctx.input.userId,
      appClientId: ctx.input.appClientId,
      enforceRequestedSkill: ctx.requestedSkillCtx != null,
      availableHostTools,
      scopedHostToolIds: hostBundle.scopedHostTools.map((tool) => tool.id),
    });
    const skillCtx = resolveSkillContextFromPlan(expanded.plan);
    let taskPlan = expanded.plan;
    let contractSkippedObservations: Array<{
      name: string;
      output: Record<string, unknown>;
    }> = [];
    if (hostBundle.scopedHostTools.length > 0) {
      const enriched = enrichPlanStepsWithHostTools(
        expanded.plan,
        hostBundle.scopedHostTools,
      );
      taskPlan = enriched.plan;
      if (enriched.prunedHostToolStepIds.length > 0) {
        deps.logger.warn(
          `host_tool plan steps pruned after enrich runId=${ctx.input.runId} stepIds=${enriched.prunedHostToolStepIds.join(',')}`,
        );
      }
    }
    if (!contract.plan.allowHostToolSteps) {
      const skipped = skipPendingHostToolStepsByContract({
        taskPlan,
        pageContext,
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
      });
      taskPlan = skipped.plan;
      contractSkippedObservations = skipped.observations;
      if (skipped.skippedStepIds.length > 0) {
        deps.logger.warn(
          `host_tool plan steps skipped by turn contract runId=${ctx.input.runId} stepIds=${skipped.skippedStepIds.join(',')}`,
        );
      }
    }
    return {
      ...state,
      taskPlan,
      toolObservations:
        contractSkippedObservations.length > 0
          ? [
              ...state.toolObservations,
              ...contractSkippedObservations.map((row) => ({
                name: row.name,
                output: row.output,
              })),
            ]
          : state.toolObservations,
      scopedTools: expanded.scopedTools,
      scopedLangChainTools: expanded.scopedToolBundle.tools,
      scopedToolBundle: expanded.scopedToolBundle,
      scopedAllowedToolIds: expanded.scopedAllowedToolIds,
      scopedHostTools: hostBundle.scopedHostTools,
      scopedHostLangChainTools: hostBundle.scopedHostLangChainTools,
      skillApplied: skillCtx.skillApplied,
      activeSkillId: skillCtx.activeSkillId,
      activeSkillPrompt: skillCtx.activeSkillPrompt,
      activeSkillName: skillCtx.activeSkillName,
      activeSkillDescription: skillCtx.activeSkillDescription,
      activeSkillConfig: skillCtx.activeSkillConfig,
      activeSkillRiskLevel: skillCtx.activeSkillRiskLevel,
    };
  };

  const withPlanSyncStep = (
    graphState: AgentGraphState,
    planAdvance: TaskPlanAdvanceResult | null,
    fromStepId: string | null,
    site: PlanSyncSite,
  ): AgentGraphState => {
    if (!planAdvance) {
      return graphState;
    }
    return {
      ...graphState,
      steps: [
        ...graphState.steps,
        toPlanSyncAgentStep({
          step: nextRunStepNumber(graphState.steps),
          planAdvance,
          fromStepId,
          site,
          planRunContext: planRunContextFromState(graphState),
          normalizeOutput: (value) => runHelpers.normalizeJsonLike(value),
        }),
      ],
    };
  };

  const prepareReActPlanState = async (state: AgentGraphState) => {
    let graphState = await applySkillFrameContext(state);
    const fromStepId = graphState.taskPlan?.currentStepId ?? null;
    const synced = syncTaskPlanBeforeReAct({
      taskPlan: graphState.taskPlan,
      scopedTools: graphState.scopedTools,
      skillConfig: graphState.activeSkillConfig,
      observationBuckets: planObservationBucketsFromState(graphState),
      pageContextEntityId: pageContextEntityIdFromGraphState(graphState),
    });
    if (synced.taskPlan && synced.taskPlan !== graphState.taskPlan) {
      graphState = { ...graphState, taskPlan: synced.taskPlan };
    }
    if (synced.planAdvance?.reason === 'plan_advance_skill_step') {
      graphState = await applySkillFrameContext(graphState);
    }
    return {
      state: graphState,
      planAdvance: synced.planAdvance,
      fromStepId,
    };
  };

  return { applySkillFrameContext, withPlanSyncStep, prepareReActPlanState };
}
