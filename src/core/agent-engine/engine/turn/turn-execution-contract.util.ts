import type { StoredTaskPlan } from '../../../memory/goa/session-goa.types';
import {
  assessPageContextData,
  resolvePageContextEntityIdForPlanSatisfaction,
} from '../../../host-bridge/page-context-usage.util';
import {
  resolvePageContextExecutionPolicy,
} from '../../../host-bridge/page-context-execution-policy.util';
import { resolveHostToolTurnPolicy } from './host-tool-turn-policy.util';
import { buildSkillCapabilityProfile } from './skill-capability-profile.util';
import {
  deriveTurnUserIntent,
  emptySkillIntentAlignment,
  resolveSkillIntentAlignment,
  toSkillIntentAlignmentSnapshot,
} from './skill-intent-alignment.util';
import type { PageContextUsage } from '../../../host-bridge/page-context-usage.types';
import type { AgentGraphState } from '../main/types/agent-engine.types';
import type {
  BuildTurnExecutionContractInput,
  TurnExecutionContract,
  TurnPlanExecutionPolicy,
  TurnPlanSkillSelect,
} from './turn-execution-contract.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
import type { TurnRoutingDecision } from './turn-routing.types';
import type { TurnScopedToolsSource } from './turn-scoped-tools.util';
import type { SkillIntentAlignmentSnapshot } from './skill-intent-alignment.types';

function resolveScopedToolsSource(input: {
  skillSelect: TurnPlanSkillSelect;
  skillAlignment: SkillIntentAlignmentSnapshot;
}): TurnScopedToolsSource {
  return input.skillSelect === 'explicit' &&
    input.skillAlignment.status === 'aligned'
    ? 'explicit_skill'
    : 'intent';
}

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
    scopedToolsSource: 'intent',
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
  if (input.requestedSkillId != null) {
    return {
      skillSelect: 'explicit',
      explicitSkillId: input.requestedSkillId,
      pageHostSkillId: null,
    };
  }
  const onPage = input.routing.route === 'on_page_task';
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
  const skillProfile =
    input.requestedSkill != null
      ? buildSkillCapabilityProfile({
          skillId: input.requestedSkill.id,
          skillName: input.requestedSkill.name,
          skillToolIds: input.requestedSkill.skillToolIds,
          hostToolIds: input.requestedSkill.hostToolIds,
          runnableKind: input.requestedSkill.runnableKind,
          channels: input.requestedSkill.executionChannels,
        })
      : null;

  if (!input.toolsEnabled) {
    return {
      routing,
      terminalRespond: null,
      skillAlignment: emptySkillIntentAlignment(),
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
      terminalRespond: null,
      skillAlignment: emptySkillIntentAlignment(),
      plan: basePlanPolicy({
        enabled: true,
        scopedToolsSource: 'intent',
        skillSelect: 'llm',
        allowHostToolSteps: false,
        allowHostToolAutoDispatch: false,
        allowHostToolLlmDispatch: false,
        allowSessionResume: false,
        abandonActiveTaskOnFreshPlan: true,
        pageContextPlan: 'none',
      }),
    };
  }

  const draftSkillSelect = resolvePlanSkillSelect(input);
  const pageContextPolicy = resolvePageContextExecutionPolicy({
    route: routing.route,
    pageContextApplies: routing.pageContextApplies,
    pageContextTaskKind: routing.pageContextTaskKind,
    pageContext: input.pageContext,
    writeChannel: input.effectiveWriteChannel,
  });
  const pageContextPlan = pageContextPolicy.plan;
  const turnIntent = deriveTurnUserIntent({
    routing,
    pageContextPlan,
    writeChannel: input.effectiveWriteChannel,
  });
  const alignment = resolveSkillIntentAlignment({
    intent: turnIntent,
    routing,
    userMessage: input.userMessage,
    requestedSkillId: input.requestedSkillId,
    skillProfile,
    skillConfig: input.requestedSkill?.config,
  });
  const skillAlignment = toSkillIntentAlignmentSnapshot(
    alignment,
    input.requestedSkillId,
  );

  if (alignment.status === 'clarify') {
    return {
      routing,
      terminalRespond: alignment.respond,
      skillAlignment,
      plan: basePlanPolicy({
        enabled: false,
        allowSessionResume: false,
        abandonActiveTaskOnFreshPlan: false,
      }),
    };
  }

  const skillSelect =
    alignment.status === 'intent_first'
      ? {
          skillSelect: alignment.effectiveSkillSelect,
          explicitSkillId: alignment.effectiveExplicitSkillId,
          pageHostSkillId: alignment.effectivePageHostSkillId,
        }
      : draftSkillSelect;

  const hostToolPolicy = resolveHostToolTurnPolicy({
    route: routing.route,
    pageContextPlan,
    writeChannel: input.effectiveWriteChannel,
  });

  const scopedToolsSource = resolveScopedToolsSource({
    skillSelect: skillSelect.skillSelect,
    skillAlignment,
  });

  return {
    routing,
    terminalRespond: null,
    skillAlignment,
    plan: basePlanPolicy({
      enabled: true,
      scopedToolsSource,
      ...skillSelect,
      allowHostToolSteps: hostToolPolicy.allowHostToolSteps,
      allowHostToolAutoDispatch: hostToolPolicy.allowHostToolAutoDispatch,
      allowHostToolLlmDispatch: hostToolPolicy.allowHostToolLlmDispatch,
      allowSessionResume: true,
      abandonActiveTaskOnFreshPlan: true,
      pageContextUsage: pageContextPolicy.usage,
      pageContextPlan,
    }),
  };
}

/** 写确认续跑等跳过 turnRoute 的路径：默认 HTTP mutation 续跑契约。 */
export function buildWriteConfirmResumeContract(
  reason: string,
  writeChannel: TurnWriteChannel = 'http',
): TurnExecutionContract {
  const hostWrite = writeChannel === 'host';
  return {
    routing: {
      route: 'orchestrated_task',
      method: 'fallback_orchestrated',
      reason,
      suggestedSkillId: null,
      pageContextApplies: false,
      pageContextTaskKind: 'none',
      llmPageContextTaskKind: 'none',
      llmWriteChannel: writeChannel,
      hostMutationIntent: hostWrite,
    },
    terminalRespond: null,
    skillAlignment: emptySkillIntentAlignment(),
    plan: basePlanPolicy({
      enabled: true,
      allowHostToolSteps: hostWrite,
      allowHostToolAutoDispatch: hostWrite,
      allowHostToolLlmDispatch: hostWrite,
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
      llmPageContextTaskKind: 'none',
      llmWriteChannel: 'none',
      hostMutationIntent: false,
    },
    terminalRespond: null,
    skillAlignment: emptySkillIntentAlignment(),
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
    const contract = state.turnExecutionContract;
    const skillAlignment =
      contract.skillAlignment ?? emptySkillIntentAlignment();
    const scopedToolsSource =
      contract.plan.scopedToolsSource ??
      (contract.plan.skillSelect === 'explicit' &&
      skillAlignment.status === 'aligned'
        ? 'explicit_skill'
        : 'intent');
    if (contract.skillAlignment && contract.plan.scopedToolsSource) {
      return contract;
    }
    return {
      ...contract,
      skillAlignment,
      plan: {
        ...contract.plan,
        scopedToolsSource,
      },
    };
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
