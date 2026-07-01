import { collectWorkflowNodeBindingRefs } from './derive-workflow-bindings-from-nodes.util';
import { validateSkillWorkflowBinding } from './validate-skill-workflow-binding.util';
import type { WorkflowNodeDef } from './workflow.types';

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch comment',
    input: { toolId: 10 },
  },
  {
    id: 'push',
    action: 'generate_and_push',
    name: 'Push',
    objective: 'Fill draft',
    input: { hostToolId: 4 },
  },
  {
    id: 'final',
    action: 'summarize',
    name: 'Summarize',
    objective: 'Reply',
    input: { mode: 'final' },
  },
];

describe('validate-skill-workflow-binding.util', () => {
  it('collectWorkflowNodeBindingRefs extracts tool and host refs', () => {
    expect(collectWorkflowNodeBindingRefs(nodes)).toEqual({
      toolIds: [10],
      hostToolIds: [4],
    });
  });

  it('passes when skill bindings cover workflow and node refs', () => {
    expect(
      validateSkillWorkflowBinding({
        nodes,
        workflowToolIds: [10],
        workflowHostToolIds: [4],
        skillToolIds: [10],
        skillHostToolIds: [4],
      }),
    ).toEqual([]);
  });

  it('fails when WorkflowHostTool is missing from SkillHostTool', () => {
    const issues = validateSkillWorkflowBinding({
      nodes,
      workflowToolIds: [10],
      workflowHostToolIds: [4],
      skillToolIds: [10],
      skillHostToolIds: [3],
    });
    expect(issues.some((row) => row.code === 'workflow_host_tool_not_in_skill')).toBe(
      true,
    );
    expect(issues.some((row) => row.code === 'node_host_tool_not_in_skill')).toBe(
      true,
    );
  });

  it('fails when WorkflowTool is missing from SkillTool', () => {
    const issues = validateSkillWorkflowBinding({
      nodes,
      workflowToolIds: [10],
      workflowHostToolIds: [4],
      skillToolIds: [],
      skillHostToolIds: [4],
    });
    expect(issues.some((row) => row.code === 'workflow_tool_not_in_skill')).toBe(true);
    expect(issues.some((row) => row.code === 'node_tool_not_in_skill')).toBe(true);
  });
});
