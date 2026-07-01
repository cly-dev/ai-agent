import type { HarnessSensorResult } from '../harness.types';
export type EmptyFillSensorPayload = {
    fillText?: string | null;
    dslOutcome?: string | null;
};
export declare const emptyFillSensor: {
    name: string;
    run(_ctx: {
        nodeId: string;
        action: string;
    }, payload: unknown): HarnessSensorResult;
};
