import {
  filterUserVisibleRunSteps,
  tagRunStepAuditTier,
} from './agent-run-audit.util';

describe('agent-run-audit.util', () => {
  it('filterUserVisibleRunSteps hides internal audit steps', () => {
    const steps = [
      { step: 1, type: 'workflow' as const, output: {} },
      tagRunStepAuditTier({ step: 2, type: 'readiness', output: {} }, 'internal'),
      { step: 3, type: 'tool' as const, name: 'read', output: {} },
      tagRunStepAuditTier({ step: 4, type: 'result_check', output: {} }, 'internal'),
    ];
    expect(filterUserVisibleRunSteps(steps).map((row) => row.step)).toEqual([1, 3]);
  });
});
