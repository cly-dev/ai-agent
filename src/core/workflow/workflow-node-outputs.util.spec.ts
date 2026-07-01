import { appendWorkflowNodeOutputsToLlmMessages } from './workflow-node-outputs.util';

describe('workflow-node-outputs.util', () => {
  it('appends prior node outputs as a user message block', () => {
    const messages = appendWorkflowNodeOutputsToLlmMessages(
      [{ role: 'system', content: 'sys' }],
      {
        'obs:fetch_data:a': { toolId: 1, output: { id: 9 } },
      },
    );
    expect(messages).toHaveLength(2);
    expect(messages[1]?.content).toContain('obs:fetch_data:a');
    expect(messages[1]?.content).toContain('"id": 9');
  });

  it('returns messages unchanged when outputs are empty', () => {
    const base = [{ role: 'user' as const, content: 'hi' }];
    expect(appendWorkflowNodeOutputsToLlmMessages(base, {})).toBe(base);
    expect(appendWorkflowNodeOutputsToLlmMessages(base, undefined)).toBe(base);
  });
});
