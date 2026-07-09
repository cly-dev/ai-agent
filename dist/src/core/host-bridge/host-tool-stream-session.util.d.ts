import { type HostActionEventPublisher } from './host-action-dispatch.util';
import type { HostActionHostToolInvocation, HostActionSsePayload } from './host-tool-stream.types';
import type { AgentChatPageContext } from './page-context.types';
export type HostToolStreamFinalizeResult = {
    streamId: string;
    hostTools: HostActionHostToolInvocation[];
    appendCount: number;
    fullPayload: HostActionSsePayload;
};
export declare class HostToolStreamSession {
    private readonly config;
    private seq;
    private streamId;
    private calls;
    private appendEmittedCount;
    private closed;
    constructor(config: {
        publish: HostActionEventPublisher;
        sessionId: string;
        pageContext: AgentChatPageContext;
        runId: number;
        turnId: number;
        planStepId?: string | null;
        hostStepId?: string | null;
        reason?: string;
        generation?: number;
    });
    get activeStreamId(): string | null;
    get isClosed(): boolean;
    get hasBegun(): boolean;
    private hostStepIdField;
    private hostStepIdPayload;
    begin(input: {
        streamId: string;
        tools: Array<{
            name: string;
            streamablePath: string;
        }>;
        reason?: string;
    }): void;
    get appendCount(): number;
    get hasActiveStream(): boolean;
    appendFillChunk(chunk: string): void;
    finalize(input: {
        hostTools: HostActionHostToolInvocation[];
        reason?: string;
    }): HostToolStreamFinalizeResult;
    dispatchInstant(input: {
        streamId: string;
        hostTools: HostActionHostToolInvocation[];
        reason?: string;
    }): HostActionSsePayload;
    abort(options?: {
        emitSessionEnd?: boolean;
    }): void;
    private scope;
    private entity;
    private metadata;
    private buildAndEmitFullPayload;
    private emitFrame;
}
