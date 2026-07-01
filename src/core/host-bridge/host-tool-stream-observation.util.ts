import type { HostActionHostToolInvocation } from './host-action.types';

export const HOST_TOOL_STREAM_OBSERVATION_NAME = 'host_tool_stream';

export type HostToolStreamObservationOutput = {
  outcome: 'dispatched' | 'failed';
  /** 与 DSL / finalizeHostToolPlanStep 共用的 host_tool plan step id。 */
  hostStepId: string;
  streamId: string;
  hostTools: HostActionHostToolInvocation[];
  streamablePath: string;
};

export type HostToolStreamToolObservation = {
  name: typeof HOST_TOOL_STREAM_OBSERVATION_NAME;
  output: HostToolStreamObservationOutput;
  quality: 'high';
};

export function buildHostToolStreamObservation(input: {
  outcome: HostToolStreamObservationOutput['outcome'];
  hostStepId: string;
  streamId: string;
  hostTools: HostActionHostToolInvocation[];
  streamablePath: string;
}): HostToolStreamToolObservation {
  return {
    name: HOST_TOOL_STREAM_OBSERVATION_NAME,
    output: {
      outcome: input.outcome,
      hostStepId: input.hostStepId,
      streamId: input.streamId,
      hostTools: input.hostTools,
      streamablePath: input.streamablePath,
    } satisfies HostToolStreamObservationOutput,
    quality: 'high',
  };
}

export function findHostToolStreamObservation(
  observations: Array<{ name: string; output?: unknown }>,
  hostStepId: string,
): HostToolStreamObservationOutput | null {
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== HOST_TOOL_STREAM_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as HostToolStreamObservationOutput;
    if (output?.hostStepId !== hostStepId) {
      continue;
    }
    if (
      output.outcome !== 'dispatched' &&
      output.outcome !== 'failed'
    ) {
      continue;
    }
    if (!Array.isArray(output.hostTools)) {
      continue;
    }
    return output;
  }
  return null;
}

export function isHostToolStreamAlreadyDispatched(
  observations: Array<{ name: string; output?: unknown }>,
  hostStepId: string,
): boolean {
  const found = findHostToolStreamObservation(observations, hostStepId);
  return found?.outcome === 'dispatched';
}
