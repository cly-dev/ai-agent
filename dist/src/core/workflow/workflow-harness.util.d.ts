import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowNodeDef } from './workflow.types';
export declare function buildHarnessSensorPayload(def: WorkflowNodeDef | undefined, state: AgentGraphState, extra?: Record<string, unknown>): unknown;
