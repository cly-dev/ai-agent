export type OutboundHttpErrorKind = 'timeout' | 'abort' | 'network' | 'ssrf';
export declare class OutboundHttpError extends Error {
    readonly kind: OutboundHttpErrorKind;
    constructor(message: string, kind: OutboundHttpErrorKind);
}
export type OutboundHttpPolicy = {
    timeoutMs: number;
    ssrf?: boolean;
    signal?: AbortSignal;
    label?: string;
};
