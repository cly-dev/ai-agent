import type { HostToolDecisionDefinition } from './host-tool-decision.types';
export declare const HOST_TOOL_STREAM_REASON: "plan_host_tool_stream";
export type HostToolStreamToolTarget = {
    name: string;
    streamablePath: string;
};
export type HostToolStreamTarget = {
    hostStepId: string;
    reasonStepId: string | null;
    streamId: string;
    tools: HostToolStreamToolTarget[];
    reason: typeof HOST_TOOL_STREAM_REASON;
};
export type PlanReasonHostStreamDelivery = {
    mode: 'stream';
    target: HostToolStreamTarget;
} | {
    mode: 'observation';
};
export declare function primaryHostToolStreamTool(target: HostToolStreamTarget): HostToolStreamToolTarget;
export declare function resolveStreamablePathFromHostTool(tool: HostToolDecisionDefinition): string | null;
export declare function resolvePlanReasonHostFillTools(input: {
    hostTools: HostToolDecisionDefinition[];
    allowedToolNames: Set<string>;
}): HostToolStreamToolTarget[];
export declare function buildHostToolStreamId(input: {
    runId: number;
    turnId: number;
    stepId: string;
}): string;
export declare function buildPlanReasonHostStreamTarget(input: {
    hostStepId: string;
    reasonStepId: string | null;
    runId: number;
    turnId: number;
    tools: HostToolStreamToolTarget[];
}): HostToolStreamTarget;
export declare function resolvePlanReasonHostStreamDelivery(input: {
    hostStepId: string | null;
    fillTools: HostToolStreamToolTarget[];
    runId: number;
    turnId: number;
    reasonStepId: string | null;
    canPublishRun: boolean;
}): PlanReasonHostStreamDelivery;
