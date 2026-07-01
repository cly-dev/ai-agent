import type { HostActionSsePayload } from '../host-bridge/host-action.types';
export type PageActionRunStepType = 'lifecycle' | 'llm' | 'dsl' | 'workflow' | 'harness';
export type PageActionRunStep = {
    step: number;
    type: PageActionRunStepType;
    name: string;
    at: string;
    status?: 'ok' | 'failed' | 'skipped';
    detail?: Record<string, unknown>;
};
export declare class PageActionRunStepRecorder {
    private readonly steps;
    private nextStep;
    constructor(steps?: PageActionRunStep[]);
    static fromJson(value: unknown): PageActionRunStepRecorder;
    record(input: {
        type: PageActionRunStepType;
        name: string;
        status?: PageActionRunStep['status'];
        detail?: Record<string, unknown>;
    }): PageActionRunStep;
    recordLifecycle(phase: string, detail?: Record<string, unknown>, status?: PageActionRunStep['status']): PageActionRunStep;
    recordLlm(name: string, detail?: Record<string, unknown>, status?: PageActionRunStep['status']): PageActionRunStep;
    recordHostActionPayload(payload: HostActionSsePayload): PageActionRunStep | null;
    toJson(): PageActionRunStep[];
}
