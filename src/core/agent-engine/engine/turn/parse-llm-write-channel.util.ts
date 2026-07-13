import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnRouteKind } from './turn-routing.types';
import type { TurnWriteChannel } from './turn-write-channel.types';

/**
 * 从 Route LLM 结构化输出推导写通道草稿。
 * - mutation → http
 * - on_page_task → host
 * - 其余 → none
 */
export function resolveDraftWriteChannelFromRouteLlm(input: {
  route: TurnRouteKind;
  pageContextTaskKind: PageContextTaskKind | string;
}): TurnWriteChannel {
  if (input.pageContextTaskKind === 'mutation') {
    return 'http';
  }
  if (input.route === 'on_page_task') {
    return 'host';
  }
  return 'none';
}
