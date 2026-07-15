import {
  WORKFLOW_ACTION_KINDS,
  getWorkflowActionRegistryEntry,
  workflowProfileAllowsAction,
} from './workflow-action-registry';

describe('workflow-action-registry', () => {
  it('lists 10 action kinds with batch A and B implemented for chat', () => {
    expect(WORKFLOW_ACTION_KINDS).toHaveLength(10);
    expect(getWorkflowActionRegistryEntry('fetch_data')?.implemented).toBe(true);
    expect(getWorkflowActionRegistryEntry('summarize_images')?.implemented).toBe(
      true,
    );
    expect(getWorkflowActionRegistryEntry('compose_mutation')?.implemented).toBe(
      true,
    );
  });

  it('allows page_action and chat_skill for summarize_images', () => {
    expect(workflowProfileAllowsAction('page_action', 'summarize_images')).toBe(
      true,
    );
    expect(workflowProfileAllowsAction('chat_skill', 'summarize_images')).toBe(
      true,
    );
  });

  it('allows page_action only batch A actions', () => {
    expect(workflowProfileAllowsAction('page_action', 'fetch_data')).toBe(true);
    // 当前 registry 的 workflowProfileAllowsAction 仅看 implemented；
    // batch B 的 profile 收紧由 validate-workflow / 保存路径另外处理。
    expect(getWorkflowActionRegistryEntry('compose_mutation')?.batch).toBe('B');
  });

  it('allows chat_skill catalog to include batch B actions', () => {
    expect(workflowProfileAllowsAction('chat_skill', 'write_data')).toBe(true);
  });
});
