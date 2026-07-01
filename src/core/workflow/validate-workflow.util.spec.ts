import {
  isValidWorkflowDefinition,
  validateWorkflowDefinition,
} from './validate-workflow.util';
import type { WorkflowDefinition } from './workflow.types';

function baseDefinition(
  overrides: Partial<WorkflowDefinition> = {},
): WorkflowDefinition {
  return {
    workflowKey: 'demo.fill',
    name: 'Demo Fill',
    profile: 'page_action',
    nodes: [
      {
        id: 'load',
        action: 'load_page_context',
        name: 'Load page',
        objective: 'Materialize page context',
        input: {},
      },
      {
        id: 'fetch',
        action: 'fetch_data',
        name: 'Fetch',
        objective: 'Fetch entity',
        input: { toolId: 10 },
      },
      {
        id: 'push',
        action: 'generate_and_push',
        name: 'Push',
        objective: 'Fill form',
        input: { hostToolId: 20 },
      },
      {
        id: 'summarize',
        action: 'summarize',
        name: 'Summarize',
        objective: 'Explain result',
        input: { mode: 'final' },
      },
    ],
    ...overrides,
  };
}

describe('validateWorkflowDefinition', () => {
  it('accepts a valid page_action workflow with bindings', () => {
    const issues = validateWorkflowDefinition({
      definition: baseDefinition(),
      bindings: { toolIds: [10], hostToolIds: [20] },
    });
    expect(issues).toEqual([]);
    expect(
      isValidWorkflowDefinition({
        definition: baseDefinition(),
        bindings: { toolIds: [10], hostToolIds: [20] },
      }),
    ).toBe(true);
  });

  it('rejects batch B actions on page_action profile', () => {
    const issues = validateWorkflowDefinition({
      definition: baseDefinition({
        profile: 'page_action',
        nodes: [
          {
            id: 'compose',
            action: 'compose_mutation',
            name: 'Compose',
            objective: 'Compose write args',
            input: { toolId: 1 },
          },
        ],
      }),
      bindings: { toolIds: [1], hostToolIds: [] },
    });
    expect(issues.some((issue) => issue.code === 'action_not_allowed_for_profile')).toBe(
      true,
    );
  });

  it('accepts implemented batch B actions on chat_skill profile', () => {
    const issues = validateWorkflowDefinition({
      definition: baseDefinition({
        profile: 'chat_skill',
        nodes: [
          {
            id: 'compose',
            action: 'compose_mutation',
            name: 'Compose',
            objective: 'Compose write args',
            input: { toolId: 1 },
          },
        ],
      }),
      bindings: { toolIds: [1], hostToolIds: [] },
    });
    expect(issues).toEqual([]);
  });

  it('rejects fetch_data without tool reference', () => {
    const issues = validateWorkflowDefinition({
      definition: baseDefinition({
        nodes: [
          {
            id: 'fetch',
            action: 'fetch_data',
            name: 'Fetch',
            objective: 'Fetch',
            input: {},
          },
        ],
      }),
    });
    expect(issues.some((issue) => issue.code === 'missing_tool_id')).toBe(true);
  });

  it('rejects unbound toolId and hostToolId', () => {
    const issues = validateWorkflowDefinition({
      definition: baseDefinition(),
      bindings: { toolIds: [], hostToolIds: [] },
    });
    expect(issues.some((issue) => issue.code === 'tool_not_bound')).toBe(true);
    expect(issues.some((issue) => issue.code === 'host_tool_not_bound')).toBe(
      true,
    );
  });

  it('rejects duplicate node ids', () => {
    const issues = validateWorkflowDefinition({
      definition: baseDefinition({
        nodes: [
          {
            id: 'dup',
            action: 'summarize',
            name: 'A',
            objective: 'A',
            input: {},
          },
          {
            id: 'dup',
            action: 'summarize',
            name: 'B',
            objective: 'B',
            input: {},
          },
        ],
      }),
    });
    expect(issues.some((issue) => issue.code === 'duplicate_node_id')).toBe(true);
  });
});
