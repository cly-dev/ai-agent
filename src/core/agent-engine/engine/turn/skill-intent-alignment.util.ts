import type { PageContextPlanKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnRouteMeta } from './turn-routing.types';
import type { TurnRespondRequest } from './turn-respond.types';
import type {
  SkillCapabilityProfile,
  SkillIntentAlignmentResult,
  SkillIntentAlignmentSnapshot,
  SkillIntentMismatchCode,
  SkillIntentMismatchPolicy,
  TurnUserIntent,
} from './skill-intent-alignment.types';
import type { TurnScopedToolsSource } from './turn-scoped-tools.util';
import type { TurnTaskKind } from './turn-task-kind.types';
import {
  mismatchCodeForUnsupportedTaskKind,
  routeFromTaskKind,
  skillSupportsTaskKind,
  writeChannelFromTaskKind,
} from './resolve-turn-task-kind.util';
import { parseSkillIntentMismatchPolicyOverrides } from './skill-config-intent-alignment.util';

const DEFAULT_MISMATCH_POLICY: Record<
  SkillIntentMismatchCode,
  SkillIntentMismatchPolicy
> = {
  read_intent_vs_http_skill: 'intent_first',
  read_intent_vs_host_only_skill: 'intent_first',
  write_intent_vs_http_only_skill: 'clarify',
  write_intent_vs_no_host_skill: 'clarify',
  direct_answer_vs_any_skill: 'intent_first',
  orchestrated_http_vs_host_only_skill: 'intent_first',
};

function resolveMismatchPolicy(
  code: SkillIntentMismatchCode,
  policyOverrides: Partial<
    Record<SkillIntentMismatchCode, SkillIntentMismatchPolicy>
  >,
): SkillIntentMismatchPolicy {
  return policyOverrides[code] ?? DEFAULT_MISMATCH_POLICY[code];
}

export function emptySkillIntentAlignment(): SkillIntentAlignmentSnapshot {
  return { status: 'none' };
}

export function deriveTurnUserIntent(input: {
  taskKind: TurnTaskKind;
  pageContextPlan: PageContextPlanKind;
}): TurnUserIntent {
  const readPlanActive = input.pageContextPlan !== 'none';
  const writeChannel = writeChannelFromTaskKind(input.taskKind);
  const route = routeFromTaskKind(input.taskKind);
  return {
    taskKind: input.taskKind,
    route,
    readPlanActive,
    pageContextPlan: input.pageContextPlan,
    writeChannel,
    hostMutation: writeChannel === 'host',
    httpOrchestrated:
      input.taskKind === 'orchestrated_read' ||
      (route === 'orchestrated_task' && !readPlanActive && writeChannel === 'none'),
  };
}

function detectSkillIntentMismatchCode(input: {
  taskKind: TurnTaskKind;
  profile: SkillCapabilityProfile;
}): SkillIntentMismatchCode | null {
  if (input.taskKind === 'direct_answer') {
    return 'direct_answer_vs_any_skill';
  }
  if (input.taskKind === 'page_read') {
    if (input.profile.isHostOnly) {
      return 'read_intent_vs_host_only_skill';
    }
    if (input.profile.isHttpOnly) {
      return 'read_intent_vs_http_skill';
    }
    return null;
  }
  if (skillSupportsTaskKind(input.profile.channels, input.taskKind)) {
    return null;
  }
  return mismatchCodeForUnsupportedTaskKind({
    taskKind: input.taskKind,
    profile: input.profile,
  });
}

export function buildSkillMismatchRespond(input: {
  code: SkillIntentMismatchCode;
  userMessage: string;
  requestedSkillId: number;
  requestedSkillName: string;
  routingReason: string;
}): TurnRespondRequest {
  return {
    kind: 'skill_intent_mismatch',
    userMessage: input.userMessage,
    payload: {
      mismatchCode: input.code,
      requestedSkillId: input.requestedSkillId,
      requestedSkillName: input.requestedSkillName,
      routingReason: input.routingReason,
    },
  };
}

function applyIntentFirstSkillSelect(): {
  effectiveSkillSelect: 'llm';
  effectiveExplicitSkillId: null;
  effectivePageHostSkillId: null;
} {
  return {
    effectiveSkillSelect: 'llm',
    effectiveExplicitSkillId: null,
    effectivePageHostSkillId: null,
  };
}

export function resolveSkillIntentAlignment(input: {
  taskKind: TurnTaskKind;
  intent: TurnUserIntent;
  routeMeta: TurnRouteMeta;
  userMessage: string;
  requestedSkillId: number | null;
  skillProfile: SkillCapabilityProfile | null;
  skillConfig?: unknown;
}): SkillIntentAlignmentResult {
  if (input.requestedSkillId == null || input.skillProfile == null) {
    return { status: 'no_requested_skill' };
  }

  const policyOverrides = parseSkillIntentMismatchPolicyOverrides(
    input.skillConfig,
  );

  const code = detectSkillIntentMismatchCode({
    taskKind: input.taskKind,
    profile: input.skillProfile,
  });
  if (code == null) {
    return { status: 'aligned' };
  }

  const policy = resolveMismatchPolicy(code, policyOverrides);
  if (policy === 'clarify') {
    return {
      status: 'clarify',
      code,
      requestedSkillId: input.requestedSkillId,
      respond: buildSkillMismatchRespond({
        code,
        userMessage: input.userMessage,
        requestedSkillId: input.requestedSkillId,
        requestedSkillName: input.skillProfile.skillName,
        routingReason: input.routeMeta.reason,
      }),
    };
  }

  const effective = applyIntentFirstSkillSelect();
  return {
    status: 'intent_first',
    code,
    requestedSkillId: input.requestedSkillId,
    ...effective,
  };
}

export function toSkillIntentAlignmentSnapshot(
  alignment: SkillIntentAlignmentResult,
  requestedSkillId: number | null,
): SkillIntentAlignmentSnapshot {
  if (alignment.status === 'no_requested_skill') {
    return { status: 'none' };
  }
  if (alignment.status === 'aligned') {
    return {
      status: 'aligned',
      requestedSkillId: requestedSkillId ?? undefined,
    };
  }
  if (alignment.status === 'clarify') {
    return {
      status: 'clarified',
      code: alignment.code,
      requestedSkillId: alignment.requestedSkillId,
    };
  }
  return {
    status: 'intent_first',
    code: alignment.code,
    requestedSkillId: alignment.requestedSkillId,
    droppedExplicitSkill: alignment.effectiveSkillSelect !== 'explicit',
  };
}

export function shouldEnforceRequestedSkillFromContract(input: {
  scopedToolsSource: TurnScopedToolsSource;
}): boolean {
  return input.scopedToolsSource === 'explicit_skill';
}
