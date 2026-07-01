import {
  importSkillConfigWorkflowDeliverable,
  importSkillConfigWorkflowNodes,
} from './import-skill-config-workflow.util';

describe('import-skill-config-workflow.util', () => {
  it('returns empty nodes when config has no workflow steps', () => {
    expect(importSkillConfigWorkflowNodes(null)).toEqual([]);
    expect(importSkillConfigWorkflowNodes({ deliverable: 'answer' })).toEqual(
      [],
    );
  });

  it('compiles legacy skill workflow steps to WorkflowNodeDef', () => {
    const nodes = importSkillConfigWorkflowNodes({
      workflow: {
        deliverable: 'answer',
        steps: [
          {
            id: 'fetch',
            phase: 'gather',
            kind: 'tool',
            objective: 'Fetch review',
            toolRole: 'read-detail',
          },
          {
            id: 'answer',
            phase: 'answer',
            kind: 'summarize',
            objective: 'Summarize',
          },
        ],
      },
    });
    expect(nodes.map((row) => row.id)).toEqual(['fetch', 'answer']);
    expect(nodes[0]?.action).toBe('fetch_data');
    expect(nodes[1]?.action).toBe('summarize');
  });

  it('reads deliverable from workflow block', () => {
    expect(
      importSkillConfigWorkflowDeliverable({
        workflow: { deliverable: 'mutation', steps: [] },
      }),
    ).toBe('mutation');
  });
});
