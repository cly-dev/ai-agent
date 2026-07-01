import type { HarnessPolicy } from '../harness.types';

export const FAIL_FAST_POLICY: HarnessPolicy = {
  onSensorFail: 'fail-fast',
};

export const DEGRADE_POLICY: HarnessPolicy = {
  onSensorFail: 'degrade',
};
