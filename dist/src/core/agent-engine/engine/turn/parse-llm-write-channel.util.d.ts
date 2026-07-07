import type { TurnRouteKind } from './turn-routing.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
export type TurnRouteLlmWriteChannelRaw = {
    route: TurnRouteKind;
    writeChannel?: TurnWriteChannel | string;
    hostMutationIntent?: boolean;
    pageContextTaskKind?: string;
};
export declare function resolveLlmWriteChannelFromRaw(raw: TurnRouteLlmWriteChannelRaw): TurnWriteChannel;
