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
import {
  reconcileTurnIntent,
  routeFromTaskKind,
  writeChannelFromTaskKind,
} from './resolve-turn-task-kind.util';
import type { PageContextUsage } from '../../../host-bridge/page-context-usage.types';
import type { AgentGraphState } from '../main/types/agent-engine.types';
import type {
  BuildTurnExecutionContractInput,
  TurnExecutionContract,
  TurnPlanExecutionPolicy,
  TurnPlanSkillSelect,
} from './turn-execution-contract.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
import {
  DEFAULT_TURN_READ_DELIVERABLE,
  type TurnRouteDraft,
  type TurnRouteMeta,
} from './turn-routing.types';
import type { TurnScopedToolsSource } from './turn-scoped-tools.util';
import type { SkillIntentAlignmentSnapshot } from './skill-intent-alignment.types';
import type { TurnTaskKind } from './turn-task-kind.types';

export function turnRouteFromContract(
  contract: Pick<TurnExecutionContract, 'taskKind'>,
) {
  return routeFromTaskKind(contract.taskKind);
}

export function turnWriteChannelFromContract(
  contract: Pick<TurnExecutionContract, 'taskKind'>,
): TurnWriteChannel {
  return writeChannelFromTaskKind(contract.taskKind);
}

function resolveScopedToolsSource(input: {
  skillSelect: TurnPlanSkillSelect;
  skillAlignment: SkillIntentAlignmentSnapshot;
}): TurnScopedToolsSource {
  return input.skillSelect === 'explicit' &&
    input.skillAlignment.status === 'aligned'
    ? 'explicit_skill'
    : 'intent';
}

function pageHostMatchesRouteMeta(
  routeMeta: TurnRouteMeta,
  pageHostCandidateId: number | null,
): boolean {
  if (!pageHostCandidateId) {
    return false;
  }
  const suggested = routeMeta.suggestedSkillId;
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

function buildDirectAnswerRouteMeta(draft: TurnRouteDraft): TurnRouteMeta {
  return {
    method: draft.method,
    reason: draft.reason,
    suggestedSkillId: draft.suggestedSkillId,
    pageContextApplies: false,
    pageContextTaskKind: 'none',
    llmPageContextTaskKind: draft.llmPageContextTaskKind,
    readDeliverable: draft.readDeliverable,
  };
}

function resolvePlanSkillSelect(input: {
  taskKind: TurnTaskKind;
  routeMeta: TurnRouteMeta;
  requestedSkillId: number | null;
  pageHostCandidateId: number | null;
}): {
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
  const onPage = routeFromTaskKind(input.taskKind) === 'on_page_task';
  if (
    onPage &&
    pageHostMatchesRouteMeta(input.routeMeta, input.pageHostCandidateId)
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
  const { routeDraft } = input;
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
      taskKind: 'direct_answer',
      routeMeta: buildDirectAnswerRouteMeta(routeDraft),
      skillChannelAnchored: false,
      terminalRespond: null,
      skillAlignment: emptySkillIntentAlignment(),
      plan: basePlanPolicy({
        enabled: false,
        allowSessionResume: false,
        abandonActiveTaskOnFreshPlan: false,
      }),
    };
  }

  if (routeDraft.route === 'direct_answer') {
    return {
      taskKind: 'direct_answer',
      routeMeta: buildDirectAnswerRouteMeta(routeDraft),
      skillChannelAnchored: false,
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

  const { taskKind, routeMeta, skillChannelAnchored } = reconcileTurnIntent({
    routeDraft,
    pageContext: input.pageContext,
    skillChannels: input.requestedSkill?.executionChannels ?? null,
    explicitSkill: input.requestedSkillId != null,
  });
  const writeChannel = writeChannelFromTaskKind(taskKind);
  const route = routeFromTaskKind(taskKind);

  const draftSkillSelect = resolvePlanSkillSelect({
    taskKind,
    routeMeta,
    requestedSkillId: input.requestedSkillId,
    pageHostCandidateId: input.pageHostCandidateId,
  });
  const pageContextPolicy = resolvePageContextExecutionPolicy({
    route,
    pageContextApplies: routeMeta.pageContextApplies,
    pageContextTaskKind: routeMeta.pageContextTaskKind,
    pageContext: input.pageContext,
    writeChannel,
  });
  const pageContextPlan = pageContextPolicy.plan;
  const turnIntent = deriveTurnUserIntent({
    taskKind,
    pageContextPlan,
  });
  const alignment = resolveSkillIntentAlignment({
    taskKind,
    intent: turnIntent,
    routeMeta,
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
      taskKind,
      routeMeta,
      skillChannelAnchored,
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
    route,
    pageContextPlan,
    writeChannel,
  });

  const scopedToolsSource = resolveScopedToolsSource({
    skillSelect: skillSelect.skillSelect,
    skillAlignment,
  });

  return {
    taskKind,
    routeMeta,
    skillChannelAnchored,
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
  const taskKind: TurnTaskKind =
    writeChannel === 'host' ? 'host_push' : 'http_mutation';
  const hostWrite = taskKind === 'host_push';
  return {
    taskKind,
    routeMeta: {
      method: 'fallback_orchestrated',
      reason,
      suggestedSkillId: null,
      pageContextApplies: false,
      pageContextTaskKind: 'none',
      llmPageContextTaskKind: 'none',
      readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    },
    skillChannelAnchored: false,
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
    taskKind: 'orchestrated_read',
    routeMeta: {
      method: 'fallback_orchestrated',
      reason,
      suggestedSkillId: null,
      pageContextApplies: false,
      pageContextTaskKind: 'none',
      llmPageContextTaskKind: 'none',
      readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    },
    skillChannelAnchored: false,
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
      taskKind: contract.taskKind ?? 'orchestrated_read',
      skillChannelAnchored: contract.skillChannelAnchored ?? false,
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
