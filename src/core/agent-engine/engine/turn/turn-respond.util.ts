import {
  buildIntentClarificationGuidance,
  buildUnsupportedIntentGuidance,
} from '../../../intent/intent-scope.util';
import type { ToolObservation } from '../main/types/agent-engine.types';
import type {
  PendingRespond,
  TurnRespondKind,
  TurnRespondRequest,
} from './turn-respond.types';

export const CLARIFICATION_REQUEST_OBSERVATION_NAME = 'clarification_request';

export function pendingRespondFromObservation(
  observation: ToolObservation,
): PendingRespond {
  return { mode: 'observation', observation };
}

export function pendingRespondFromTurn(
  request: TurnRespondRequest,
): PendingRespond {
  return { mode: 'turn', request };
}

export function hasPendingRespond(
  pending: PendingRespond | null | undefined,
): boolean {
  return pending != null;
}

/** intent / readiness 的回合级回复：summarize 后应结束本 turn，不可续进 llm。 */
export function isTerminalTurnRespondPending(
  pending: PendingRespond | null | undefined,
): boolean {
  return pending?.mode === 'turn';
}

export function guidanceHintForTurnKind(kind: TurnRespondKind): string | undefined {
  switch (kind) {
    case 'message_unclear':
      return buildIntentClarificationGuidance('');
    case 'unsupported_scope':
    case 'intent_recall_failed':
      return buildUnsupportedIntentGuidance();
    default:
      return undefined;
  }
}

/** Turn 就绪层请求 → summarize 节点可消费的 observation 形态。 */
export function turnRespondRequestToObservation(
  request: TurnRespondRequest,
): ToolObservation {
  if (request.kind === 'clarification') {
    return {
      name: CLARIFICATION_REQUEST_OBSERVATION_NAME,
      output: {
        userMessage: request.userMessage,
        missingFields: request.payload?.missingFields ?? [],
        planStepId: request.payload?.planStepId,
        toolRole: request.payload?.toolRole,
        readinessReason: request.payload?.readinessReason,
      },
      quality: 'high',
    };
  }
  if (request.kind === 'smalltalk') {
    return {
      name: 'smalltalk',
      output: { userMessage: request.userMessage },
      quality: 'medium',
    };
  }
  if (request.kind === 'off_domain') {
    return {
      name: 'off_domain',
      output: {
        userMessage: request.userMessage,
        routingReason: request.payload?.routingReason ?? null,
      },
      quality: 'medium',
    };
  }
  if (request.kind === 'direct_reply') {
    return {
      name: 'direct_reply',
      output: request.payload ?? { userMessage: request.userMessage },
      quality: 'medium',
    };
  }
  const guidanceHint = guidanceHintForTurnKind(request.kind);
  return {
    name: 'direct_user',
    output: guidanceHint
      ? { userMessage: request.userMessage, guidanceHint }
      : { userMessage: request.userMessage },
    quality: 'medium',
  };
}

export function resolveObservationForSummarize(
  pending: PendingRespond | null | undefined,
): ToolObservation | null {
  if (!pending) {
    return null;
  }
  if (pending.mode === 'observation') {
    return pending.observation;
  }
  return turnRespondRequestToObservation(pending.request);
}
