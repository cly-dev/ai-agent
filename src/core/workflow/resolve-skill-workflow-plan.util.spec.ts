import { tryBuildTaskPlanFromSkillWorkflow } from './resolve-skill-workflow-plan.util';

jest.mock('./load-workflow-definition.util', () => ({
  loadWorkflowForRun: jest.fn(),
  parseWorkflowOverridesJson: jest.fn(() => null),
}));

import { loadWorkflowForRun } from './load-workflow-definition.util';

describe('resolve-skill-workflow-plan.util', () => {
  it('compiles loaded workflow nodes into TaskPlanSnapshot', async () => {
    jest.mocked(loadWorkflowForRun).mockResolvedValue({
      workflowId: 5,
      version: 2,
      compiledFrom: 'workflow_db',
      nodes: [
        {
          id: 'fetch',
          action: 'fetch_data',
          name: 'Fetch',
          objective: 'Fetch review',
          input: { toolId: 1 },
        },
        {
          id: 'answer',
          action: 'summarize',
          name: 'Answer',
          objective: 'Summarize',
          input: { mode: 'final' },
        },
      ],
      edges: [],
      entryNodeId: null,
      edgesDeclared: false,
      workflowRun: {} as never,
    });

    const plan = await tryBuildTaskPlanFromSkillWorkflow({} as never, {
      appClientId: 3,
      userMessage: 'Explain review',
      binding: { workflowId: 5, workflowVersion: 2 },
      allowedToolIds: [1],
      allowedHostToolIds: [],
    });

    expect(plan?.source).toBe('workflow');
    expect(plan?.steps.map((row) => row.id)).toEqual(['fetch', 'answer']);
    expect(plan?.pendingStepIds).toEqual(['fetch', 'answer']);
  });

  it('returns null when workflow cannot be loaded', async () => {
    jest.mocked(loadWorkflowForRun).mockResolvedValue(null);
    const plan = await tryBuildTaskPlanFromSkillWorkflow({} as never, {
      appClientId: 3,
      userMessage: 'x',
      binding: { workflowId: 99 },
      allowedToolIds: [],
      allowedHostToolIds: [],
    });
    expect(plan).toBeNull();
  });
});
