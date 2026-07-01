import type { HostActionHostToolInvocation } from './host-action.types';
export declare const HOST_TOOL_STREAM_OBSERVATION_NAME = "host_tool_stream";
export type HostToolStreamObservationOutput = {
    outcome: 'dispatched' | 'failed';
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
export declare function buildHostToolStreamObservation(input: {
    outcome: HostToolStreamObservationOutput['outcome'];
    hostStepId: string;
    streamId: string;
    hostTools: HostActionHostToolInvocation[];
    streamablePath: string;
}): HostToolStreamToolObservation;
export declare function findHostToolStreamObservation(observations: Array<{
    name: string;
    output?: unknown;
}>, hostStepId: string): HostToolStreamObservationOutput | null;
export declare function isHostToolStreamAlreadyDispatched(observations: Array<{
    name: string;
    output?: unknown;
}>, hostStepId: string): boolean;
