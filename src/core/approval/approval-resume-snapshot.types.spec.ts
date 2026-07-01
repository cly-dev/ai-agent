import {
  isChatApprovalSnapshot,
  type ApprovalResumeSnapshot,
} from './approval-resume-snapshot.types';

describe('approval-resume-snapshot.types', () => {
  it('isChatApprovalSnapshot narrows chat channel', () => {
    const chat: ApprovalResumeSnapshot = {
      version: 1,
      workflowRun: {
        workflowId: 1,
        version: 1,
        status: 'running',
        currentNodeId: 'await',
        compiledFrom: 'workflow_db',
        nodes: [],
      },
      workflowNodeDefs: [],
      workflowNodeOutputs: {},
      pendingWrite: { name: 't', arguments: {}, riskLevel: 'L2' },
      scopedToolIds: [],
      channel: {
        kind: 'chat',
        sessionId: 's',
        runId: 1,
        turnId: 2,
        resume: {
          steps: [],
          iteration: 0,
          toolObservations: [],
          scopedToolIds: [],
          intentKind: 'task',
          hasExpandedOnce: false,
        },
      },
    };
    expect(isChatApprovalSnapshot(chat)).toBe(true);
    expect(
      isChatApprovalSnapshot({
        ...chat,
        channel: { kind: 'page_action', pageActionRunId: 1 },
      }),
    ).toBe(false);
  });
});
