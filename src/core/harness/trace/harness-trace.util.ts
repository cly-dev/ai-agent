import type { HarnessTraceEvent, HarnessVerdict } from '../harness.types';

export function buildHarnessTraceEvent(input: {
  phase: HarnessTraceEvent['phase'];
  name: string;
  verdict: HarnessVerdict;
  nodeId: string;
  code?: string;
  message?: string;
}): HarnessTraceEvent {
  return {
    phase: input.phase,
    name: input.name,
    verdict: input.verdict,
    nodeId: input.nodeId,
    timestamp: new Date().toISOString(),
    code: input.code,
    message: input.message,
  };
}

export function harnessTraceToAgentStepOutput(
  events: HarnessTraceEvent[],
): Record<string, unknown> {
  return {
    harnessTrace: events,
  };
}
