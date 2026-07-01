import { validatePageActionWorkflowBinding } from './validate-page-action-workflow-binding.util';
import type { WorkflowNodeDef } from './workflow.types';

describe('validate-page-action-workflow-binding.util', () => {
  const nodes: WorkflowNodeDef[] = [
    {
      id: 'push',
      action: 'generate_and_push',
      name: 'Push',
      objective: 'Fill',
      input: { hostToolId: 12 },
    },
  ];

  it('passes when PageAction hostToolId matches workflow node', () => {
    expect(
      validatePageActionWorkflowBinding({
        pageActionHostToolId: 12,
        nodes,
      }),
    ).toEqual([]);
  });

  it('fails when workflow has no generate_and_push node', () => {
    const issues = validatePageActionWorkflowBinding({
      pageActionHostToolId: 12,
      nodes: [
        {
          id: 'fetch',
          action: 'fetch_data',
          name: 'Fetch',
          objective: 'Fetch',
          input: { toolId: 1 },
        },
      ],
    });
    expect(issues.some((row) => row.code === 'missing_generate_and_push')).toBe(
      true,
    );
  });

  it('fails when PageAction hostToolId mismatches workflow node', () => {
    const issues = validatePageActionWorkflowBinding({
      pageActionHostToolId: 3,
      nodes,
    });
    expect(issues.some((row) => row.code === 'page_action_host_tool_not_in_workflow_nodes')).toBe(
      true,
    );
  });
});
