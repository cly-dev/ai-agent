export declare const HOST_TOOL_STREAM_PROTOCOL_VERSION: 1;
export type HostToolStreamMode = 'begin' | 'delta' | 'commit' | 'end' | 'full';
export type HostToolStreamControl = {
    mode: HostToolStreamMode;
    seq: number;
};
export type HostToolDslSessionBegin = {
    op: 'session.begin';
    streamId: string;
    scope?: string;
    entity?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    reason?: string;
    hostStepId?: string;
    planStepId?: string;
    runId?: number;
    turnId?: number;
};
export type HostToolDslSessionEnd = {
    op: 'session.end';
    streamId: string;
};
export type HostToolDslToolBegin = {
    op: 'tool.begin';
    streamId: string;
    callId: string;
    index: number;
    name: string;
};
export type HostToolDslArgSet = {
    op: 'arg.set';
    streamId: string;
    callId: string;
    path: string;
    value: unknown;
};
export type HostToolDslArgAppend = {
    op: 'arg.append';
    streamId: string;
    callId: string;
    path: string;
    chunk: string;
};
export type HostToolDslToolCommit = {
    op: 'tool.commit';
    streamId: string;
    callId: string;
};
export type HostToolDslToolFlush = {
    op: 'tool.flush';
    streamId: string;
    callId: string;
    name: string;
    args: Record<string, unknown>;
};
export type HostToolDslOp = HostToolDslSessionBegin | HostToolDslSessionEnd | HostToolDslToolBegin | HostToolDslArgSet | HostToolDslArgAppend | HostToolDslToolCommit | HostToolDslToolFlush;
export type HostActionHostToolInvocation = {
    name: string;
    args: Record<string, unknown>;
};
export type HostActionBatchPayload = {
    action: 'host_action';
    scope?: string;
    entity?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    hostTools: HostActionHostToolInvocation[];
    hostStepId?: string;
    planStepId?: string;
    reason?: string;
    runId?: number;
    turnId?: number;
    generation?: number;
};
export type HostActionStreamPayload = {
    action: 'host_action';
    v?: typeof HOST_TOOL_STREAM_PROTOCOL_VERSION;
    stream: HostToolStreamControl;
    dsl?: HostToolDslOp;
    scope?: string;
    entity?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    hostTools?: HostActionHostToolInvocation[];
    hostStepId?: string;
    planStepId?: string;
    reason?: string;
    runId?: number;
    turnId?: number;
    generation?: number;
};
export type HostActionSsePayload = HostActionBatchPayload | HostActionStreamPayload;
export declare function isHostActionStreamPayload(payload: HostActionSsePayload): payload is HostActionStreamPayload;
export declare function isHostActionBatchPayload(payload: HostActionSsePayload): payload is HostActionBatchPayload;
