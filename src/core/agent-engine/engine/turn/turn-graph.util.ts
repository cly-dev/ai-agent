import type { AgentGraphState } from '../main/types/agent-engine.types';
import { hasPendingRespond } from './turn-respond.util';

export function shouldRouteToRespond(
  state: Pick<AgentGraphState, 'pendingRespond' | 'finished'>,
): boolean {
  if (state.finished) {
    return false;
  }
  return hasPendingRespond(state.pendingRespond);
}
