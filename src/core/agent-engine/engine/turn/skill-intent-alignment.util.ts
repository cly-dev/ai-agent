import type { PageContextPlanKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
import type { TurnRoutingDecision } from './turn-routing.types';
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
  routing: TurnRoutingDecision;
  pageContextPlan: PageContextPlanKind;
  writeChannel?: TurnWriteChannel;
}): TurnUserIntent {
  const readPlanActive = input.pageContextPlan !== 'none';
  const writeChannel =
    input.writeChannel ??
    input.routing.llmWriteChannel;
  return {
    route: input.routing.route,
    readPlanActive,
    pageContextPlan: input.pageContextPlan,
    writeChannel,
    hostMutation: writeChannel === 'host',
    httpOrchestrated:
      input.routing.route === 'orchestrated_task' &&
      !readPlanActive &&
      writeChannel === 'none',
  };
}

function detectSkillIntentMismatchCode(input: {
  intent: TurnUserIntent;
  profile: SkillCapabilityProfile;
}): SkillIntentMismatchCode | null {
  if (input.intent.route === 'direct_answer') {
    return 'direct_answer_vs_any_skill';
  }
  if (input.intent.readPlanActive) {
    if (input.profile.isHostOnly) {
      return 'read_intent_vs_host_only_skill';
    }
    if (input.profile.isHttpOnly) {
      return 'read_intent_vs_http_skill';
    }
    return null;
  }
  if (input.intent.writeChannel === 'http') {
    if (input.profile.channels.httpMutation) {
      return null;
    }
    if (input.profile.channels.hostPush && !input.profile.channels.httpRead) {
      return 'write_intent_vs_no_host_skill';
    }
    if (input.profile.isHttpOnly || input.profile.channels.httpRead) {
      return 'write_intent_vs_http_only_skill';
    }
    return 'write_intent_vs_no_host_skill';
  }
  if (input.intent.writeChannel === 'host') {
    if (input.profile.channels.hostPush) {
      return null;
    }
    if (input.profile.channels.httpMutation && !input.profile.channels.hostPush) {
      return 'write_intent_vs_http_only_skill';
    }
    return 'write_intent_vs_no_host_skill';
  }
  if (input.intent.httpOrchestrated && input.profile.isHostOnly) {
    return 'orchestrated_http_vs_host_only_skill';
  }
  return null;
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
  intent: TurnUserIntent;
  routing: TurnRoutingDecision;
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
    intent: input.intent,
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
        routingReason: input.routing.reason,
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
