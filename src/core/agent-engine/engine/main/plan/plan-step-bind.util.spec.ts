import {
  compilePlanToolSteps,
  planToolStepsAreExecutable,
} from './plan-step-bind.util';
import type { TaskPlanStep } from './task-plan.types';

describe('plan-step-bind.util', () => {
  it('pins tool when step id matches scoped tool name', () => {
    const steps: TaskPlanStep[] = [
      {
        id: 'listRecords',
        phase: 'gather',
        kind: 'tool',
        objective: 'fetch data',
        stopWhen: 'observation_fetch_complete',
      },
    ];
    const compiled = compilePlanToolSteps(steps, [
      {
        name: 'listRecords',
        role: 'read-list',
      },
    ]);
    expect(compiled[0]?.pinnedToolNames).toEqual(['listRecords']);
    expect(compiled[0]?.toolRole).toBe('read-list');
    expect(planToolStepsAreExecutable(compiled)).toBe(true);
  });

  it('reports non-executable when tool step lacks role after bind', () => {
    const steps: TaskPlanStep[] = [
      {
        id: 'unknownStep',
        phase: 'gather',
        kind: 'tool',
        objective: 'fetch',
        stopWhen: 'observation_fetch_complete',
      },
    ];
    const compiled = compilePlanToolSteps(steps, []);
    expect(planToolStepsAreExecutable(compiled)).toBe(false);
  });
});
