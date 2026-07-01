export type HarnessVerdict = 'pass' | 'fail' | 'skip';

export type HarnessPhase = 'before_node' | 'after_node' | 'on_error';

export type HarnessSensorResult = {
  name: string;
  verdict: HarnessVerdict;
  code?: string;
  message?: string;
  skipReason?: string;
};

export type HarnessContext = {
  nodeId: string;
  action: string;
  profile: 'chat' | 'page';
};

export type HarnessHook = {
  name: string;
  run: (ctx: HarnessContext) => Promise<void> | void;
};

export type HarnessSensor = {
  name: string;
  run: (ctx: HarnessContext, payload: unknown) => HarnessSensorResult | Promise<HarnessSensorResult>;
};

export type HarnessPolicy = {
  onSensorFail: 'fail-fast' | 'degrade';
};

export type HarnessTraceEvent = {
  phase: HarnessPhase;
  name: string;
  verdict: HarnessVerdict;
  nodeId: string;
  timestamp: string;
  code?: string;
  message?: string;
};

export type HarnessRunNodeResult<T> = {
  value: T;
  trace: HarnessTraceEvent[];
  sensorFailed?: HarnessSensorResult;
};
