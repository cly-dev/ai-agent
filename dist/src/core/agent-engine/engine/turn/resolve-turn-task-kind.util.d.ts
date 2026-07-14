import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { SkillIntentMismatchCode } from './skill-intent-alignment.types';
import type { TurnRouteDraft, TurnRouteKind, TurnRouteMeta } from './turn-routing.types';
import type { TurnTaskKind } from './turn-task-kind.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
export type ReconcileTurnIntentResult = {
    taskKind: TurnTaskKind;
    routeMeta: TurnRouteMeta;
    skillChannelAnchored: boolean;
};
export declare function writeChannelFromTaskKind(taskKind: TurnTaskKind): TurnWriteChannel;
export declare function routeFromTaskKind(taskKind: TurnTaskKind): TurnRouteKind;
export declare function reconcileTurnIntent(input: {
    routeDraft: TurnRouteDraft;
    pageContext: AgentChatPageContext | null | undefined;
    skillChannels: SkillExecutionChannels | null;
    explicitSkill: boolean;
}): ReconcileTurnIntentResult;
export declare function skillSupportsTaskKind(channels: SkillExecutionChannels, taskKind: TurnTaskKind): boolean;
export declare function mismatchCodeForUnsupportedTaskKind(input: {
    taskKind: TurnTaskKind;
    profile: {
        isHostOnly: boolean;
        isHttpOnly: boolean;
        channels: SkillExecutionChannels;
    };
}): SkillIntentMismatchCode | null;
