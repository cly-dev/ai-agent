import { appendWorkflowNodeOutputsToMessages } from './page-workflow-messages.util';

describe('page-workflow-messages.util', () => {
  it('appendWorkflowNodeOutputsToMessages is a no-op for empty outputs', () => {
    const messages = [{ role: 'user' as const, content: 'hello' }];
    expect(appendWorkflowNodeOutputsToMessages(messages, {})).toEqual(messages);
  });

  it('appendWorkflowNodeOutputsToMessages adds a user block with JSON payloads', () => {
    const messages = [{ role: 'system' as const, content: 'sys' }];
    const next = appendWorkflowNodeOutputsToMessages(messages, {
      'obs:fetch_data:n1': { toolName: 'get_item', output: { id: 1 } },
    });
    expect(next).toHaveLength(2);
    expect(next[1]?.role).toBe('user');
    expect(next[1]?.content).toContain('obs:fetch_data:n1');
    expect(next[1]?.content).toContain('get_item');
  });
});
