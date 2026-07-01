import { applyWorkflowOverrides } from './apply-workflow-overrides.util';
import type { WorkflowNodeDef } from './workflow.types';

const sampleNodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Load data',
    input: { toolId: 1 },
  },
  {
    id: 'summarize',
    action: 'summarize',
    name: 'Summarize',
    objective: 'Explain to user',
    input: { mode: 'final' },
  },
];

describe('applyWorkflowOverrides', () => {
  it('returns shallow copies when overrides are empty', () => {
    const result = applyWorkflowOverrides(sampleNodes, undefined);
    expect(result).not.toBe(sampleNodes);
    expect(result[0]).not.toBe(sampleNodes[0]);
    expect(result).toEqual(sampleNodes);
  });

  it('merges objective for a single nodeId', () => {
    const result = applyWorkflowOverrides(sampleNodes, {
      summarize: { objective: 'Custom objective for this PageAction' },
    });
    expect(result[0]?.objective).toBe('Load data');
    expect(result[1]?.objective).toBe('Custom objective for this PageAction');
  });

  it('does not mutate the source nodes array', () => {
    applyWorkflowOverrides(sampleNodes, {
      fetch: { objective: 'Changed' },
    });
    expect(sampleNodes[0]?.objective).toBe('Load data');
  });
});
