import type { HarnessContext, HarnessHook, HarnessPolicy, HarnessRunNodeResult, HarnessSensor, HarnessSensorResult, HarnessTraceEvent } from './harness.types';
export type HarnessRunnerConfig = {
    hooks?: HarnessHook[];
    sensors?: HarnessSensor[];
    policy?: HarnessPolicy;
};
export declare class HarnessRunner {
    private readonly config;
    constructor(config?: HarnessRunnerConfig);
    runNode<T>(input: {
        ctx: HarnessContext;
        execute: () => Promise<T>;
        sensorPayload?: unknown;
    }): Promise<HarnessRunNodeResult<T>>;
    runAfterNodeSensors(input: {
        ctx: HarnessContext;
        payload: unknown;
    }): Promise<{
        trace: HarnessTraceEvent[];
        sensorFailed?: HarnessSensorResult;
    }>;
}
export declare function createChatHarnessRunner(): HarnessRunner;
export declare function createPageHarnessRunner(sensors?: HarnessSensor[]): HarnessRunner;
