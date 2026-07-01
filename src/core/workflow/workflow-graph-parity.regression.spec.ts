/**
 * V2 workflow graph routing regression checks.
 */

import { workflowNodeRequiresReactLoop } from './workflow-plan-sync.util';

describe('workflow graph v2 regression', () => {
  it('mutation actions use workflow_react delegate', () => {
    expect(
      workflowNodeRequiresReactLoop({
        id: 'c',
        action: 'compose_mutation',
        name: 'C',
        objective: 'C',
        input: {},
      }),
    ).toBe(true);
    expect(
      workflowNodeRequiresReactLoop({
        id: 'p',
        action: 'present_mutation',
        name: 'P',
        objective: 'P',
        input: {},
      }),
    ).toBe(false);
    expect(
      workflowNodeRequiresReactLoop({
        id: 'f',
        action: 'fetch_data',
        name: 'F',
        objective: 'F',
        input: {},
      }),
    ).toBe(true);
  });
});
