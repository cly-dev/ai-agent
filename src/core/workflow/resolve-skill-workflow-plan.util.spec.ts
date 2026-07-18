import { tryBuildTaskPlanFromSkillWorkflow } from './resolve-skill-workflow-plan.util';

jest.mock('./load-workflow-definition.util', () => ({
  parseWorkflowOverridesJson: jest.fn(() => null),
}));

jest.mock('./load-flow-for-run.util', () => ({
  loadFlowForRunDetailed: jest.fn(),
}));

import { loadFlowForRunDetailed } from './load-flow-for-run.util';

describe('resolve-skill-workflow-plan.util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('compiles loaded Flow nodes into TaskPlanSnapshot', async () => {
    jest.mocked(loadFlowForRunDetailed).mockResolvedValue({
      status: 'loaded',
      workflowId: 5,
      version: 2,
      compiledFrom: 'flow_db',
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
      binding: { flowId: 5, flowVersion: 2 },
      allowedToolIds: [1],
      allowedHostToolIds: [],
    });

    expect(plan?.source).toBe('workflow');
    expect(plan?.steps.map((row) => row.id)).toEqual(['fetch', 'answer']);
    expect(plan?.pendingStepIds).toEqual(['fetch', 'answer']);
  });

  it('returns null when only legacy workflowId is bound', async () => {
    const plan = await tryBuildTaskPlanFromSkillWorkflow({} as never, {
      appClientId: 3,
      userMessage: 'x',
      binding: { workflowId: 99 },
      allowedToolIds: [],
      allowedHostToolIds: [],
    });
    expect(plan).toBeNull();
    expect(loadFlowForRunDetailed).not.toHaveBeenCalled();
  });

  it('returns null when Flow cannot be loaded', async () => {
    jest.mocked(loadFlowForRunDetailed).mockResolvedValue({
      status: 'failed',
      reason: 'asset_missing',
      workflowId: 99,
    });
    const plan = await tryBuildTaskPlanFromSkillWorkflow({} as never, {
      appClientId: 3,
      userMessage: 'x',
      binding: { flowId: 99 },
      allowedToolIds: [],
      allowedHostToolIds: [],
    });
    expect(plan).toBeNull();
  });
});
