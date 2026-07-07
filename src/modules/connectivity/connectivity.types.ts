export type ConnectivityCheckTarget =
  | 'database'
  | 'redis'
  | 'llm_chat'
  | 'llm_embedding';

export type ConnectivityCheckResult = {
  target: ConnectivityCheckTarget | string;
  ok: boolean;
  durationMs: number;
  detail?: Record<string, unknown>;
  error?: string;
};

export type ConnectivityBatchResult = {
  checkedAt: string;
  checks: ConnectivityCheckResult[];
};
