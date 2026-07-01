import type { HarnessSensorResult } from '../harness.types';

export type EmptyFillSensorPayload = {
  fillText?: string | null;
  dslOutcome?: string | null;
};

export const emptyFillSensor = {
  name: 'empty-fill',
  run(
    _ctx: { nodeId: string; action: string },
    payload: unknown,
  ): HarnessSensorResult {
    const data = payload as EmptyFillSensorPayload | null | undefined;
    const fillText = data?.fillText?.trim() ?? '';
    const dslOutcome = data?.dslOutcome ?? null;
    if (fillText.length > 0 && dslOutcome === 'dispatched') {
      return { name: 'empty-fill', verdict: 'pass' };
    }
    if (fillText.length === 0) {
      return {
        name: 'empty-fill',
        verdict: 'fail',
        code: 'STREAM_EMPTY',
        message: 'fillText is empty after generate_and_push',
      };
    }
    return {
      name: 'empty-fill',
      verdict: 'fail',
      code: 'DSL_NOT_DISPATCHED',
      message: `dslOutcome is ${dslOutcome ?? 'null'}, expected dispatched`,
    };
  },
};
