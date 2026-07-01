import type { ToolObservation } from '../main/types/agent-engine.types';
export type TurnRespondKind = 'smalltalk' | 'off_domain' | 'message_unclear' | 'unsupported_scope' | 'intent_recall_failed' | 'clarification' | 'skill_intent_mismatch' | 'direct_reply';
export type TurnRespondMissingField = {
    name: string;
    hint: string;
};
export type TurnRespondRequest = {
    kind: TurnRespondKind;
    userMessage: string;
    payload?: {
        missingFields?: TurnRespondMissingField[];
        planStepId?: string;
        toolRole?: string;
        readinessReason?: string;
        routingReason?: string;
        mismatchCode?: string;
        requestedSkillId?: number;
        requestedSkillName?: string;
    };
};
export type PendingRespond = {
    mode: 'turn';
    request: TurnRespondRequest;
} | {
    mode: 'observation';
    observation: ToolObservation;
};
export type TurnReadinessStatus = 'ready' | 'respond';
export type TurnReadinessResult = {
    status: 'ready';
    reason: string;
} | {
    status: 'respond';
    reason: string;
    request: TurnRespondRequest;
};
