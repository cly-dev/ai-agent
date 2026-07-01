import { buildWorkflowNodeOutputRef } from './workflow-node-output.util';

describe('workflow-node-output.util', () => {
  it('builds stable outputRef from action and nodeId', () => {
    expect(buildWorkflowNodeOutputRef('load_page_context', 'ctx')).toBe(
      'obs:load_page_context:ctx',
    );
    expect(buildWorkflowNodeOutputRef('summarize', 'answer')).toBe(
      'obs:summarize:answer',
    );
  });
});
