import type { StoredTaskPlan } from '../../../memory/goa/session-goa.types';
import {
  assessPageContextData,
  resolvePageContextEntityIdForPlanSatisfaction,
} from '../../../host-bridge/page-context-usage.util';
import {
  isHostPageWorkflowEnabled,
  resolvePageContextExecutionPolicy,
} from '../../../host-bridge/page-context-execution-policy.util';
import type { PageContextUsage } from '../../../host-bridge/page-context-usage.types';
import type { AgentGraphState } from '../main/types/agent-engine.types';
import type {
  BuildTurnExecutionContractInput,
  TurnExecutionContract,
  TurnPlanExecutionPolicy,
  TurnPlanSkillSelect,
} from './turn-execution-contract.types';
import type { TurnRoutingDecision } from './turn-routing.types';

function pageHostMatchesRouting(
  routing: TurnRoutingDecision,
  pageHostCandidateId: number | null,
): boolean {
  if (!pageHostCandidateId) {
    return false;
  }
  const suggested = routing.suggestedSkillId;
  if (suggested != null && suggested !== pageHostCandidateId) {
    return false;
  }
  return true;
}

function emptyPageContextUsage(): PageContextUsage {
  return { ...assessPageContextData(null), applies: false };
}

function basePlanPolicy(
  overrides: Partial<TurnPlanExecutionPolicy> & Pick<TurnPlanExecutionPolicy, 'enabled'>,
): TurnPlanExecutionPolicy {
  return {
    skillSelect: 'llm',
    explicitSkillId: null,
    pageHostSkillId: null,
    allowHostToolSteps: false,
    allowHostToolAutoDispatch: false,
    allowHostToolLlmDispatch: false,
    allowSessionResume: true,
    abandonActiveTaskOnFreshPlan: true,
    pageContextUsage: emptyPageContextUsage(),
    pageContextPlan: 'none',
    ...overrides,
  };
}

function resolvePlanSkillSelect(input: BuildTurnExecutionContractInput): {
  skillSelect: TurnPlanSkillSelect;
  explicitSkillId: number | null;
  pageHostSkillId: number | null;
} {
  const onPage = input.routing.route === 'on_page_task';
  if (input.requestedSkillId != null) {
    if (onPage || !input.requestedSkillIsHostOnly) {
      return {
        skillSelect: 'explicit',
        explicitSkillId: input.requestedSkillId,
        pageHostSkillId: null,
      };
    }
    return { skillSelect: 'llm', explicitSkillId: null, pageHostSkillId: null };
  }
  if (
    onPage &&
    pageHostMatchesRouting(input.routing, input.pageHostCandidateId)
  ) {
    return {
      skillSelect: 'page_host',
      explicitSkillId: null,
      pageHostSkillId: input.pageHostCandidateId,
    };
  }
  return { skillSelect: 'llm', explicitSkillId: null, pageHostSkillId: null };
}

export function pageContextEntityIdFromGraphState(
  state: Pick<AgentGraphState, 'turnExecutionContract' | 'pageContext'>,
): string | null {
  return resolvePageContextEntityIdForPlanSatisfaction({
    pageContextUsage: state.turnExecutionContract?.plan.pageContextUsage,
    pageContext: state.pageContext ?? null,
  });
}

/** 由 turnRoute 节点产出：本轮唯一执行策略。 */
export function buildTurnExecutionContract(
  input: BuildTurnExecutionContractInput,
): TurnExecutionContract {
  const { routing } = input;

  if (!input.toolsEnabled) {
    return {
      routing,
      terminalRespond: null,
      plan: basePlanPolicy({
        enabled: false,
        allowSessionResume: false,
        abandonActiveTaskOnFreshPlan: false,
      }),
    };
  }

  if (routing.route === 'direct_answer') {
    return {
      routing,
      terminalRespond: {
        kind: 'off_domain',
        userMessage: input.userMessage,
        payload: { routingReason: routing.reason },
      },
      plan: basePlanPolicy({
        enabled: false,
        allowSessionResume: false,
        abandonActiveTaskOnFreshPlan: false,
      }),
    };
  }

  const skillSelect = resolvePlanSkillSelect(input);
  const pageContextPolicy = resolvePageContextExecutionPolicy({
    route: routing.route,
    pageContextApplies: routing.pageContextApplies,
    pageContextTaskKind: routing.pageContextTaskKind,
    pageContext: input.pageContext,
  });
  const pageContextPlan = pageContextPolicy.plan;
  const hostWorkflow = isHostPageWorkflowEnabled({
    route: routing.route,
    pageContextPlan,
  });

  return {
    routing,
    terminalRespond: null,
    plan: basePlanPolicy({
      enabled: true,
      ...skillSelect,
      allowHostToolSteps: hostWorkflow,
      allowHostToolAutoDispatch: hostWorkflow,
      allowHostToolLlmDispatch: hostWorkflow,
      allowSessionResume: true,
      abandonActiveTaskOnFreshPlan: true,
      pageContextUsage: pageContextPolicy.usage,
      pageContextPlan,
    }),
  };
}

/** 写确认 / resumeFromLlm 等跳过 turnRoute 的路径：显式宽松契约。 */
export function buildLegacyTurnExecutionContract(
  reason: string,
): TurnExecutionContract {
  return {
    routing: {
      route: 'orchestrated_task',
      method: 'fallback_orchestrated',
      reason,
      suggestedSkillId: null,
      pageContextApplies: false,
      pageContextTaskKind: 'none',
    },
    terminalRespond: null,
    plan: basePlanPolicy({
      enabled: true,
      allowHostToolSteps: true,
      allowHostToolAutoDispatch: true,
      allowHostToolLlmDispatch: true,
      allowSessionResume: true,
      abandonActiveTaskOnFreshPlan: false,
    }),
  };
}

/** 契约缺失时的收紧默认：允许 orchestrated Plan，但禁止 host_tool。 */
export function buildRestrictiveTurnExecutionContract(
  reason: string,
): TurnExecutionContract {
  return {
    routing: {
      route: 'orchestrated_task',
      method: 'fallback_orchestrated',
      reason,
      suggestedSkillId: null,
      pageContextApplies: false,
      pageContextTaskKind: 'none',
    },
    terminalRespond: null,
    plan: basePlanPolicy({
      enabled: true,
      allowHostToolSteps: false,
      allowHostToolAutoDispatch: false,
      allowHostToolLlmDispatch: false,
      allowSessionResume: true,
      abandonActiveTaskOnFreshPlan: true,
    }),
  };
}

/** 只读 state 上已写入的契约；缺失时收紧（legacy 路径须在图初始化显式写入契约）。 */
export function resolveTurnExecutionContract(
  state: Pick<AgentGraphState, 'turnExecutionContract'>,
  reason = 'missing_turn_execution_contract',
  log?: Pick<Console, 'warn'> | { warn: (message: string) => void },
): TurnExecutionContract {
  if (state.turnExecutionContract) {
    return state.turnExecutionContract;
  }
  log?.warn(
    `turn execution contract missing; restrictive fallback reason=${reason}`,
  );
  return buildRestrictiveTurnExecutionContract(reason);
}

/** 持久化 Plan 是否允许在本轮契约下 session resume。 */
export function storedPlanCompatibleWithContract(
  contract: TurnExecutionContract,
  stored: StoredTaskPlan,
): boolean {
  if (!contract.plan.allowSessionResume) {
    return false;
  }
  if (!contract.plan.allowHostToolSteps) {
    const method = stored.outerSkillSelectMethod?.trim();
    if (method === 'page_host_unique') {
      return false;
    }
    const hasHostToolStep = stored.steps.some((step) => step.kind === 'host_tool');
    if (hasHostToolStep) {
      return false;
    }
    for (const frame of stored.frames ?? []) {
      if (frame.steps.some((step) => step.kind === 'host_tool')) {
        return false;
      }
    }
  }
  return true;
}
