import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnRoutingDecision } from './turn-routing.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
export type { TurnWriteChannel } from './turn-write-channel.types';
export declare function inferDraftWriteChannelFromRouting(routing: TurnRoutingDecision): TurnWriteChannel;
export declare function finalizeTurnWriteChannel(input: {
    routing: TurnRoutingDecision;
    skillChannels: SkillExecutionChannels | null;
}): {
    writeChannel: TurnWriteChannel;
    routing: TurnRoutingDecision;
    skillChannelAnchored: boolean;
};
