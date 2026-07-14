import type { TurnRouteDraft } from './turn-routing.types';
export declare function guardTaskRouteDraftForIntent(input: {
    intentKind: 'task' | 'smalltalk' | 'unclear';
    routeDraft: TurnRouteDraft;
}): TurnRouteDraft;
