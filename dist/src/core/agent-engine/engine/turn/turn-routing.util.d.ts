import type { TurnRouteLlmInput, TurnRoutingDecision } from './turn-routing.types';
export { finalizeTurnRoutingDecision } from './turn-user-intent.util';
export declare function buildChitchatRoutingDecision(input: {
    reason: string;
}): TurnRoutingDecision;
export declare function buildTurnRouteFallbackDecision(input: {
    reason: string;
}): TurnRoutingDecision;
export declare function buildTurnRouteLlmUserPayload(input: TurnRouteLlmInput): string;
