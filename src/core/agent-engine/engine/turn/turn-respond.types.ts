import type { ToolObservation } from '../main/agent-engine.types';

export type TurnRespondKind =
  | 'smalltalk'
  | 'message_unclear'
  | 'unsupported_scope'
  | 'intent_recall_failed'
  | 'clarification'
  | 'direct_reply';

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
  };
};

export type PendingRespond =
  | { mode: 'turn'; request: TurnRespondRequest }
  | { mode: 'observation'; observation: ToolObservation };

export type TurnReadinessStatus = 'ready' | 'respond';

export type TurnReadinessResult =
  | { status: 'ready'; reason: string }
  | {
      status: 'respond';
      reason: string;
      request: TurnRespondRequest;
    };
