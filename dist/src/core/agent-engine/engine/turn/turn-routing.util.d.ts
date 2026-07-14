import { type TurnRouteDraft, type TurnRouteLlmInput } from './turn-routing.types';
export declare function buildChitchatRouteDraft(input: {
    reason: string;
}): TurnRouteDraft;
export declare function buildTurnRouteFallbackDraft(input: {
    reason: string;
}): TurnRouteDraft;
export declare function buildTurnRouteLlmUserPayload(input: TurnRouteLlmInput): string;
