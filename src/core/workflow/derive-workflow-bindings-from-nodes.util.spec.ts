import {
  collectWorkflowNodeBindingRefs,
  deriveWorkflowBindingsFromNodes,
  resolveWorkflowBindingsForSave,
} from './derive-workflow-bindings-from-nodes.util';
import type { WorkflowNodeDef } from './workflow.types';

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch',
    input: { toolId: 10 },
  },
  {
    id: 'push',
    action: 'generate_and_push',
    name: 'Push',
    objective: 'Push',
    input: { hostToolId: 4 },
  },
];

describe('derive-workflow-bindings-from-nodes.util', () => {
  it('collectWorkflowNodeBindingRefs reads toolId and hostToolId from nodes', () => {
    expect(collectWorkflowNodeBindingRefs(nodes)).toEqual({
      toolIds: [10],
      hostToolIds: [4],
    });
  });

  it('deriveWorkflowBindingsFromNodes builds binding rows from nodes only', () => {
    expect(deriveWorkflowBindingsFromNodes(nodes)).toEqual({
      tools: [{ toolId: 10, isRequired: false }],
      hostTools: [{ hostToolId: 4, isRequired: false }],
    });
  });

  it('resolveWorkflowBindingsForSave uses nodes as SSOT and merges isRequired', () => {
    expect(
      resolveWorkflowBindingsForSave({
        nodes,
        explicitTools: [{ toolId: 10, isRequired: true }],
        explicitHostTools: [{ hostToolId: 4, isRequired: true }],
      }),
    ).toEqual({
      tools: [{ toolId: 10, isRequired: true }],
      hostTools: [{ hostToolId: 4, isRequired: true }],
      issues: [],
    });
  });

  it('resolveWorkflowBindingsForSave rejects orphan explicit bindings', () => {
    const result = resolveWorkflowBindingsForSave({
      nodes,
      explicitTools: [{ toolId: 99 }],
      explicitHostTools: [{ hostToolId: 8 }],
    });
    expect(result.tools).toEqual([{ toolId: 10, isRequired: false }]);
    expect(result.hostTools).toEqual([{ hostToolId: 4, isRequired: false }]);
    expect(result.issues.map((row) => row.code)).toEqual([
      'orphan_tool_binding',
      'orphan_host_tool_binding',
    ]);
  });
});
