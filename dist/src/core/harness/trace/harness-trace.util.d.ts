import type { HarnessTraceEvent, HarnessVerdict } from '../harness.types';
export declare function buildHarnessTraceEvent(input: {
    phase: HarnessTraceEvent['phase'];
    name: string;
    verdict: HarnessVerdict;
    nodeId: string;
    code?: string;
    message?: string;
}): HarnessTraceEvent;
export declare function harnessTraceToAgentStepOutput(events: HarnessTraceEvent[]): Record<string, unknown>;
