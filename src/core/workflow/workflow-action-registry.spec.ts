import {
  WORKFLOW_ACTION_KINDS,
  getWorkflowActionRegistryEntry,
  workflowProfileAllowsAction,
} from './workflow-action-registry';

describe('workflow-action-registry', () => {
  it('lists 8 action kinds with batch A and B implemented for chat', () => {
    expect(WORKFLOW_ACTION_KINDS).toHaveLength(8);
    expect(getWorkflowActionRegistryEntry('fetch_data')?.implemented).toBe(true);
    expect(getWorkflowActionRegistryEntry('compose_mutation')?.implemented).toBe(
      true,
    );
  });

  it('allows page_action only batch A actions', () => {
    expect(workflowProfileAllowsAction('page_action', 'fetch_data')).toBe(true);
    expect(workflowProfileAllowsAction('page_action', 'compose_mutation')).toBe(
      false,
    );
  });

  it('allows chat_skill catalog to include batch B actions', () => {
    expect(workflowProfileAllowsAction('chat_skill', 'write_data')).toBe(true);
  });
});
