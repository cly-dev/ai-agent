import type { HarnessSensorResult } from '../harness.types';
export type EmptySummarySensorPayload = {
    summaryText?: string | null;
    mode?: string | null;
};
export declare const emptySummarySensor: {
    name: string;
    run(_ctx: {
        nodeId: string;
        action: string;
    }, payload: unknown): HarnessSensorResult;
};
