import type { HarnessPolicy } from '../harness.types';

export const DEGRADE_POLICY: HarnessPolicy = {
  onSensorFail: 'degrade',
};
