import type { ToolObservation } from '../../agent-engine/engine/main/types/agent-engine.types';
import type { HarnessSensorResult } from '../harness.types';
export type ToolEmptySensorPayload = {
    observations?: ToolObservation[];
    toolId?: number;
    toolName?: string;
    agentMetadata?: unknown;
};
export declare const toolEmptySensor: {
    name: string;
    run(_ctx: {
        nodeId: string;
        action: string;
    }, payload: unknown): HarnessSensorResult;
};
