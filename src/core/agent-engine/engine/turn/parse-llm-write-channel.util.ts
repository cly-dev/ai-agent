import type { TurnRouteKind } from './turn-routing.types';
import type { TurnWriteChannel } from './turn-write-channel.types';

export type TurnRouteLlmWriteChannelRaw = {
  route: TurnRouteKind;
  writeChannel?: TurnWriteChannel | string;
  hostMutationIntent?: boolean;
  pageContextTaskKind?: string;
};

/**
 * 将 route LLM 输出解析为 writeChannel。
 * 优先使用 writeChannel；兼容 legacy hostMutationIntent / pageContextTaskKind=mutation。
 */
export function resolveLlmWriteChannelFromRaw(
  raw: TurnRouteLlmWriteChannelRaw,
): TurnWriteChannel {
  if (raw.writeChannel === 'http' || raw.writeChannel === 'host') {
    return raw.writeChannel;
  }
  if (raw.writeChannel === 'none') {
    if (raw.route === 'on_page_task') {
      return 'host';
    }
    return 'none';
  }
  if (raw.route === 'on_page_task') {
    return 'host';
  }
  if (raw.hostMutationIntent || raw.pageContextTaskKind === 'mutation') {
    return 'http';
  }
  return 'none';
}
