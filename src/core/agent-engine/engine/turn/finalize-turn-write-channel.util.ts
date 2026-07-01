import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnRoutingDecision } from './turn-routing.types';
import type { TurnWriteChannel } from './turn-write-channel.types';

export type { TurnWriteChannel } from './turn-write-channel.types';

const SKILL_CHANNEL_ANCHOR_SUFFIX = ' [skill_channel_anchor:http_mutation]';

export function inferDraftWriteChannelFromRouting(
  routing: TurnRoutingDecision,
): TurnWriteChannel {
  return routing.llmWriteChannel;
}

function anchorRoutingForHttpMutation(
  routing: TurnRoutingDecision,
): TurnRoutingDecision {
  const reason = routing.reason.includes(SKILL_CHANNEL_ANCHOR_SUFFIX)
    ? routing.reason
    : `${routing.reason}${SKILL_CHANNEL_ANCHOR_SUFFIX}`;
  return {
    ...routing,
    route:
      routing.route === 'on_page_task' ? 'orchestrated_task' : routing.route,
    llmWriteChannel: 'http',
    hostMutationIntent: false,
    reason,
  };
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

/**
 * 合并路由 LLM 草稿与显式 Skill 执行通道：
 * - LLM 常把 API 变更误判为 host 写
 * - 当 Skill 绑定 mutation Workflow 或仅 httpMutation 时，锚定为 http 写并校正 route
 */
export function finalizeTurnWriteChannel(input: {
  routing: TurnRoutingDecision;
  skillChannels: SkillExecutionChannels | null;
}): {
  writeChannel: TurnWriteChannel;
  routing: TurnRoutingDecision;
  skillChannelAnchored: boolean;
} {
  let writeChannel = inferDraftWriteChannelFromRouting(input.routing);
  let routing = input.routing;
  let skillChannelAnchored = false;

  const channels = input.skillChannels;
  if (channels && writeChannel === 'host' && shouldAnchorHostDraftToHttp(channels)) {
    writeChannel = 'http';
    routing = anchorRoutingForHttpMutation(routing);
    skillChannelAnchored = true;
  }

  return { writeChannel, routing, skillChannelAnchored };
}
