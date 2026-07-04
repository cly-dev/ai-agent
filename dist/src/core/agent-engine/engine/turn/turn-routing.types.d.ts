import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnWriteChannel } from './turn-write-channel.types';
import type { PageContextTaskKind, TurnPageReadKind } from '../../../host-bridge/page-context-usage.types';
export type TurnRouteKind = 'direct_answer' | 'on_page_task' | 'orchestrated_task';
export type TurnRoutingMethod = 'llm' | 'fallback_orchestrated';
export type TurnRoutingDecision = {
    route: TurnRouteKind;
    method: TurnRoutingMethod;
    reason: string;
    suggestedSkillId: number | null;
    pageContextApplies: boolean;
    pageContextTaskKind: TurnPageReadKind;
    llmPageContextTaskKind: PageContextTaskKind;
    llmWriteChannel: TurnWriteChannel;
    hostMutationIntent: boolean;
};
export type TurnRouteLlmInput = {
    userMessage: string;
    pageContext: Record<string, unknown> | null;
    intentRecallMatches: Array<{
        id: number;
        label: string;
        score: number;
    }>;
    availableSkills: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
    availableHostTools: Array<{
        name: string;
        description: string;
    }>;
    pageHostSkillCandidate: {
        id: number;
        name: string;
    } | null;
    requestedSkill: {
        id: number;
        name: string;
        description: string | null;
    } | null;
    requestedSkillExecutionChannels?: SkillExecutionChannels | null;
};
