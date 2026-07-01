import type {
  HarnessContext,
  HarnessHook,
  HarnessPolicy,
  HarnessRunNodeResult,
  HarnessSensor,
  HarnessSensorResult,
  HarnessTraceEvent,
} from './harness.types';
import { buildHarnessTraceEvent } from './trace/harness-trace.util';

export type HarnessRunnerConfig = {
  hooks?: HarnessHook[];
  sensors?: HarnessSensor[];
  policy?: HarnessPolicy;
};

const DEFAULT_POLICY: HarnessPolicy = {
  onSensorFail: 'degrade',
};

export class HarnessRunner {
  constructor(private readonly config: HarnessRunnerConfig = {}) {}

  async runNode<T>(input: {
    ctx: HarnessContext;
    execute: () => Promise<T>;
    sensorPayload?: unknown;
  }): Promise<HarnessRunNodeResult<T>> {
    const trace = [];
    const hooks = this.config.hooks ?? [];
    const sensors = this.config.sensors ?? [];
    const policy = this.config.policy ?? DEFAULT_POLICY;

    for (const hook of hooks) {
      await hook.run(input.ctx);
      trace.push(
        buildHarnessTraceEvent({
          phase: 'before_node',
          name: hook.name,
          verdict: 'pass',
          nodeId: input.ctx.nodeId,
        }),
      );
    }

    let value: T;
    try {
      value = await input.execute();
    } catch (error) {
      trace.push(
        buildHarnessTraceEvent({
          phase: 'on_error',
          name: 'executor',
          verdict: 'fail',
          nodeId: input.ctx.nodeId,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      throw error;
    }

    let sensorFailed: HarnessSensorResult | undefined;
    for (const sensor of sensors) {
      const result = await sensor.run(input.ctx, input.sensorPayload ?? value);
      trace.push(
        buildHarnessTraceEvent({
          phase: 'after_node',
          name: sensor.name,
          verdict: result.verdict,
          nodeId: input.ctx.nodeId,
          code: result.code,
          message: result.message ?? result.skipReason,
        }),
      );
      if (result.verdict === 'fail' && policy.onSensorFail === 'fail-fast') {
        sensorFailed = result;
        break;
      }
    }

    return { value, trace, sensorFailed };
  }

  async runAfterNodeSensors(input: {
    ctx: HarnessContext;
    payload: unknown;
  }): Promise<{
    trace: HarnessTraceEvent[];
    sensorFailed?: HarnessSensorResult;
  }> {
    const trace = [];
    const sensors = this.config.sensors ?? [];
    const policy = this.config.policy ?? DEFAULT_POLICY;
    let sensorFailed: HarnessSensorResult | undefined;

    for (const sensor of sensors) {
      const result = await sensor.run(input.ctx, input.payload);
      trace.push(
        buildHarnessTraceEvent({
          phase: 'after_node',
          name: sensor.name,
          verdict: result.verdict,
          nodeId: input.ctx.nodeId,
          code: result.code,
          message: result.message ?? result.skipReason,
        }),
      );
      if (result.verdict === 'fail' && policy.onSensorFail === 'fail-fast') {
        sensorFailed = result;
        break;
      }
    }

    return { trace, sensorFailed };
  }
}

export function createChatHarnessRunner(): HarnessRunner {
  return new HarnessRunner({ policy: { onSensorFail: 'degrade' } });
}

export function createPageHarnessRunner(sensors: HarnessSensor[] = []): HarnessRunner {
  return new HarnessRunner({
    sensors,
    policy: { onSensorFail: 'fail-fast' },
  });
}
