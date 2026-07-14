import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnRouteKind } from './turn-routing.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
export declare function resolveDraftWriteChannelFromRouteLlm(input: {
    route: TurnRouteKind;
    pageContextTaskKind: PageContextTaskKind | string;
}): TurnWriteChannel;
