import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import { resolveCanonicalTurnRoute } from '../../../host-bridge/page-context-execution-policy.util';
import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { SkillIntentMismatchCode } from './skill-intent-alignment.types';
import { resolveTurnPageReadIntent } from './turn-user-intent.util';
import type {
  TurnRouteDraft,
  TurnRouteKind,
  TurnRouteMeta,
} from './turn-routing.types';
import type { TurnTaskKind } from './turn-task-kind.types';
import type { TurnWriteChannel } from './turn-write-channel.types';

const SKILL_CHANNEL_ANCHOR_SUFFIX = ' [skill_channel_anchor:http_mutation]';

export type ReconcileTurnIntentResult = {
  taskKind: TurnTaskKind;
  routeMeta: TurnRouteMeta;
  skillChannelAnchored: boolean;
};

type NormalizedRouteContext = TurnRouteDraft & {
  pageContextTaskKind: TurnRouteMeta['pageContextTaskKind'];
};

export function writeChannelFromTaskKind(
  taskKind: TurnTaskKind,
): TurnWriteChannel {
  switch (taskKind) {
    case 'http_mutation':
      return 'http';
    case 'host_push':
      return 'host';
    default:
      return 'none';
  }
}

/** pageContext 结构化评估 + 写草稿压制读路径（原 finalizeTurnRoutingDecision 职责）。 */
function normalizeRouteDraftWithPageContext(input: {
  draft: TurnRouteDraft;
  pageContext: AgentChatPageContext | null | undefined;
}): NormalizedRouteContext {
  const pageReadDraft = resolveTurnPageReadIntent({
    route: input.draft.route,
    method: input.draft.method,
    llmPageContextApplies: input.draft.pageContextApplies,
    llmPageContextTaskKind: input.draft.llmPageContextTaskKind,
    pageContext: input.pageContext,
  });

  const pageRead =
    input.draft.draftWriteChannel !== 'none'
      ? { applies: pageReadDraft.applies, kind: 'none' as const }
      : pageReadDraft;

  const route = resolveCanonicalTurnRoute({
    llmRoute: input.draft.route,
    pageContextTaskKind: pageRead.kind,
  });

  return {
    ...input.draft,
    route,
    pageContextApplies: pageRead.applies,
    pageContextTaskKind: pageRead.kind,
  };
}

export function routeFromTaskKind(taskKind: TurnTaskKind): TurnRouteKind {
  switch (taskKind) {
    case 'direct_answer':
      return 'direct_answer';
    case 'host_push':
      return 'on_page_task';
    default:
      return 'orchestrated_task';
  }
}

function shouldAnchorHostDraftToHttp(
  channels: SkillExecutionChannels,
): boolean {
  if (!channels.httpMutation) {
    return false;
  }
  if (!channels.hostPush) {
    return true;
  }
  return channels.primaryWriteChannel === 'http';
}

function applySkillChannelDraftAnchor(input: {
  normalized: NormalizedRouteContext;
  skillChannels: SkillExecutionChannels | null;
}): {
  normalized: NormalizedRouteContext;
  draftWriteChannel: TurnWriteChannel;
  skillChannelAnchored: boolean;
} {
  let normalized = input.normalized;
  let draftWriteChannel = normalized.draftWriteChannel;
  let skillChannelAnchored = false;

  const channels = input.skillChannels;
  if (
    channels &&
    draftWriteChannel === 'host' &&
    shouldAnchorHostDraftToHttp(channels)
  ) {
    draftWriteChannel = 'http';
    skillChannelAnchored = true;
    const reason = normalized.reason.includes(SKILL_CHANNEL_ANCHOR_SUFFIX)
      ? normalized.reason
      : `${normalized.reason}${SKILL_CHANNEL_ANCHOR_SUFFIX}`;
    normalized = {
      ...normalized,
      route:
        normalized.route === 'on_page_task'
          ? 'orchestrated_task'
          : normalized.route,
      draftWriteChannel: 'http',
      reason,
    };
  }

  return { normalized, draftWriteChannel, skillChannelAnchored };
}

function resolvePageReadTaskKind(input: {
  normalized: NormalizedRouteContext;
  pageContext: AgentChatPageContext | null | undefined;
}): TurnTaskKind | null {
  if (
    input.normalized.pageContextApplies &&
    (input.normalized.pageContextTaskKind === 'analyze' ||
      input.normalized.pageContextTaskKind === 'answer')
  ) {
    return 'page_read';
  }
  return null;
}

function resolveHttpDraftTaskKindForDualCapabilitySkill(input: {
  normalized: NormalizedRouteContext;
  pageContext: AgentChatPageContext | null | undefined;
}): TurnTaskKind {
  if (
    input.normalized.llmPageContextTaskKind === 'analyze' ||
    input.normalized.llmPageContextTaskKind === 'answer'
  ) {
    const pageRead = resolvePageReadTaskKind(input);
    if (pageRead) {
      return pageRead;
    }
    return 'orchestrated_read';
  }
  return 'http_mutation';
}

function resolveExplicitSkillTaskKind(input: {
  normalized: NormalizedRouteContext;
  pageContext: AgentChatPageContext | null | undefined;
  draftWriteChannel: TurnWriteChannel;
  skillChannels: SkillExecutionChannels;
}): TurnTaskKind {
  const { draftWriteChannel, skillChannels } = input;

  if (draftWriteChannel === 'http') {
    if (skillChannels.httpRead && !skillChannels.httpMutation) {
      return 'orchestrated_read';
    }
    if (skillChannels.httpMutation && !skillChannels.httpRead) {
      return 'http_mutation';
    }
    if (skillChannels.httpRead && skillChannels.httpMutation) {
      return resolveHttpDraftTaskKindForDualCapabilitySkill(input);
    }
    return 'http_mutation';
  }

  if (draftWriteChannel === 'host') {
    if (skillChannels.hostPush) {
      return 'host_push';
    }
    if (skillChannels.httpMutation) {
      return 'http_mutation';
    }
    return 'host_push';
  }

  const pageRead = resolvePageReadTaskKind(input);
  if (pageRead) {
    return pageRead;
  }
  if (input.normalized.route === 'orchestrated_task') {
    return 'orchestrated_read';
  }
  if (input.normalized.route === 'on_page_task') {
    return skillChannels.hostPush ? 'host_push' : 'orchestrated_read';
  }
  return 'orchestrated_read';
}

function resolveTurnTaskKind(input: {
  normalized: NormalizedRouteContext;
  pageContext: AgentChatPageContext | null | undefined;
  draftWriteChannel: TurnWriteChannel;
  skillChannels: SkillExecutionChannels | null;
  explicitSkill: boolean;
}): TurnTaskKind {
  if (input.normalized.route === 'direct_answer') {
    return 'direct_answer';
  }

  if (input.explicitSkill && input.skillChannels) {
    return resolveExplicitSkillTaskKind({
      normalized: input.normalized,
      pageContext: input.pageContext,
      draftWriteChannel: input.draftWriteChannel,
      skillChannels: input.skillChannels,
    });
  }

  const pageRead = resolvePageReadTaskKind(input);
  if (pageRead) {
    return pageRead;
  }
  // orchestrated_task 语义是读/分析编排；Route LLM 误标 draftWriteChannel=http 不得压成 mutation。
  if (input.normalized.route === 'orchestrated_task') {
    return 'orchestrated_read';
  }
  if (input.normalized.route === 'on_page_task') {
    return 'host_push';
  }

  if (input.draftWriteChannel === 'http') {
    return 'http_mutation';
  }
  if (input.draftWriteChannel === 'host') {
    return 'host_push';
  }

  return 'orchestrated_read';
}

function buildRouteMetaFromTaskKind(
  normalized: NormalizedRouteContext,
  taskKind: TurnTaskKind,
): TurnRouteMeta {
  let pageContextTaskKind = normalized.pageContextTaskKind;
  if (taskKind === 'page_read') {
    if (
      pageContextTaskKind === 'none' &&
      (normalized.llmPageContextTaskKind === 'analyze' ||
        normalized.llmPageContextTaskKind === 'answer')
    ) {
      pageContextTaskKind = normalized.llmPageContextTaskKind;
    }
  } else if (writeChannelFromTaskKind(taskKind) !== 'none') {
    pageContextTaskKind = 'none';
  }

  return {
    method: normalized.method,
    reason: normalized.reason,
    suggestedSkillId: normalized.suggestedSkillId,
    pageContextApplies: normalized.pageContextApplies,
    pageContextTaskKind,
    llmPageContextTaskKind: normalized.llmPageContextTaskKind,
    readDeliverable: normalized.readDeliverable,
  };
}

/**
 * Turn 意图唯一调和入口：Route 草稿 → pageContext 评估 → TaskKind → 终态 routing。
 */
export function reconcileTurnIntent(input: {
  routeDraft: TurnRouteDraft;
  pageContext: AgentChatPageContext | null | undefined;
  skillChannels: SkillExecutionChannels | null;
  explicitSkill: boolean;
}): ReconcileTurnIntentResult {
  const normalized = normalizeRouteDraftWithPageContext({
    draft: input.routeDraft,
    pageContext: input.pageContext,
  });
  const {
    normalized: anchored,
    draftWriteChannel,
    skillChannelAnchored,
  } = applySkillChannelDraftAnchor({
    normalized,
    skillChannels: input.skillChannels,
  });
  const taskKind = resolveTurnTaskKind({
    normalized: anchored,
    pageContext: input.pageContext,
    draftWriteChannel,
    skillChannels: input.skillChannels,
    explicitSkill: input.explicitSkill,
  });
  const routeMeta = buildRouteMetaFromTaskKind(anchored, taskKind);
  return {
    taskKind,
    routeMeta,
    skillChannelAnchored,
  };
}

export function skillSupportsTaskKind(
  channels: SkillExecutionChannels,
  taskKind: TurnTaskKind,
): boolean {
  switch (taskKind) {
    case 'direct_answer':
    case 'page_read':
      return true;
    case 'orchestrated_read':
      return channels.httpRead;
    case 'http_mutation':
      return channels.httpMutation;
    case 'host_push':
      return channels.hostPush;
    default:
      return false;
  }
}

export function mismatchCodeForUnsupportedTaskKind(input: {
  taskKind: TurnTaskKind;
  profile: {
    isHostOnly: boolean;
    isHttpOnly: boolean;
    channels: SkillExecutionChannels;
  };
}): SkillIntentMismatchCode | null {
  const channels = input.profile.channels;
  switch (input.taskKind) {
    case 'orchestrated_read':
      return 'orchestrated_http_vs_host_only_skill';
    case 'http_mutation':
      if (channels.hostPush && !channels.httpRead) {
        return 'write_intent_vs_no_host_skill';
      }
      if (input.profile.isHttpOnly || channels.httpRead) {
        return 'write_intent_vs_http_only_skill';
      }
      return 'write_intent_vs_no_host_skill';
    case 'host_push':
      if (channels.httpMutation && !channels.hostPush) {
        return 'write_intent_vs_http_only_skill';
      }
      return 'write_intent_vs_no_host_skill';
    default:
      return null;
  }
}
