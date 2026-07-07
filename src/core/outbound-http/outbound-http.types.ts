export type OutboundHttpErrorKind = 'timeout' | 'abort' | 'network' | 'ssrf';

export class OutboundHttpError extends Error {
  readonly kind: OutboundHttpErrorKind;

  constructor(message: string, kind: OutboundHttpErrorKind) {
    super(message);
    this.name = 'OutboundHttpError';
    this.kind = kind;
  }
}

export type OutboundHttpPolicy = {
  timeoutMs: number;
  /** 默认 true：出站前执行 SSRF 校验。 */
  ssrf?: boolean;
  signal?: AbortSignal;
  label?: string;
};
