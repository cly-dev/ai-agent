import type { PageContextPlanKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnRouteMeta } from './turn-routing.types';
import type { TurnRespondRequest } from './turn-respond.types';
import type { SkillCapabilityProfile, SkillIntentAlignmentResult, SkillIntentAlignmentSnapshot, SkillIntentMismatchCode, TurnUserIntent } from './skill-intent-alignment.types';
import type { TurnScopedToolsSource } from './turn-scoped-tools.util';
import type { TurnTaskKind } from './turn-task-kind.types';
export declare function emptySkillIntentAlignment(): SkillIntentAlignmentSnapshot;
export declare function deriveTurnUserIntent(input: {
    taskKind: TurnTaskKind;
    pageContextPlan: PageContextPlanKind;
}): TurnUserIntent;
export declare function buildSkillMismatchRespond(input: {
    code: SkillIntentMismatchCode;
    userMessage: string;
    requestedSkillId: number;
    requestedSkillName: string;
    routingReason: string;
}): TurnRespondRequest;
export declare function resolveSkillIntentAlignment(input: {
    taskKind: TurnTaskKind;
    intent: TurnUserIntent;
    routeMeta: TurnRouteMeta;
    userMessage: string;
    requestedSkillId: number | null;
    skillProfile: SkillCapabilityProfile | null;
    skillConfig?: unknown;
}): SkillIntentAlignmentResult;
export declare function toSkillIntentAlignmentSnapshot(alignment: SkillIntentAlignmentResult, requestedSkillId: number | null): SkillIntentAlignmentSnapshot;
export declare function shouldEnforceRequestedSkillFromContract(input: {
    scopedToolsSource: TurnScopedToolsSource;
}): boolean;
