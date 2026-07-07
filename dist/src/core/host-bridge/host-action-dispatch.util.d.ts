import type { HostActionSsePayload } from './host-action.types';
export type HostActionEventPublisher = (sessionId: string, envelope: {
    event: 'host_action';
    payload: HostActionSsePayload;
}) => void;
export declare function dispatchHostActionSse(publish: HostActionEventPublisher, sessionId: string, payload: HostActionSsePayload): void;
