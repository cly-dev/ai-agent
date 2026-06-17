export type HostActionStatus = 'completed';

/** Flat SSE payload consumed by omnix-chat SDK. */
export type HostActionSsePayload = {
  action: 'host_action';
  /** Mutation succeeded; UI reaction is entirely host-defined. */
  status: HostActionStatus;
  scope?: string;
  entity?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  reason?: string;
  runId?: number;
  turnId?: number;
};
