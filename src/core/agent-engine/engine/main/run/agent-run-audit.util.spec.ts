import {
  filterUserVisibleRunSteps,
  tagRunStepAuditTier,
} from './agent-run-audit.util';

describe('agent-run-audit.util', () => {
  it('filterUserVisibleRunSteps hides internal audit steps', () => {
    const steps = [
      { step: 1, type: 'workflow' as const, output: {} },
      tagRunStepAuditTier({ step: 2, type: 'readiness', output: {} }, 'internal'),
      tagRunStepAuditTier({ step: 3, type: 'tool_resolve', output: {} }, 'internal'),
      tagRunStepAuditTier({ step: 4, type: 'param_gate', output: {} }, 'internal'),
      { step: 5, type: 'tool' as const, name: 'read', output: {} },
      tagRunStepAuditTier({ step: 6, type: 'result_check', output: {} }, 'internal'),
      tagRunStepAuditTier({ step: 7, type: 'gather_pipeline', output: {} }, 'internal'),
    ];
    expect(filterUserVisibleRunSteps(steps).map((row) => row.step)).toEqual([1, 5]);
  });
});
