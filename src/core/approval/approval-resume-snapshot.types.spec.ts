import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';

describe('approval-resume-snapshot.types', () => {
  it('parses page_action channel snapshot', () => {
    const snapshot: ApprovalResumeSnapshot = {
      version: 1,
      workflowRun: {
        workflowId: 1,
        version: 1,
        status: 'running',
        currentNodeId: 'n1',
        compiledFrom: 'workflow_db',
        nodes: [],
      },
      workflowNodeDefs: [],
      workflowNodeOutputs: {},
      pendingWrite: { name: 'tool', arguments: {}, riskLevel: 'L2' },
      scopedToolIds: [1],
      channel: { kind: 'page_action', pageActionRunId: 42 },
    };

    expect(snapshot.channel.kind).toBe('page_action');
  });
});
