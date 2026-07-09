import type { AgentGraphState } from '../main/types/agent-engine.types';
export declare function shouldRouteToRespond(state: Pick<AgentGraphState, 'pendingRespond' | 'finished'>): boolean;
