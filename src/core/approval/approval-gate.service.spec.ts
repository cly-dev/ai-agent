import { ApprovalGateService } from './approval-gate.service';
import type { ApprovalRequestService } from './approval-request.service';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { WorkflowRunState } from '../workflow/workflow.types';

describe('ApprovalGateService', () => {
  const workflowRun: WorkflowRunState = {
    workflowId: 3,
    version: 1,
    status: 'running',
    currentNodeId: 'await',
    compiledFrom: 'workflow_db',
    nodes: [],
  };

  it('suspend creates pending request and appends audit step', async () => {
    const approvalRequests = {
      createPending: jest.fn().mockResolvedValue({ id: 55 }),
    } as unknown as ApprovalRequestService;
    const service = new ApprovalGateService(approvalRequests);
    const recorder = new PageActionRunStepRecorder();

    const approval = await service.suspend({
      appClientId: 1,
      source: 'page_action',
      initiatorUserId: 7,
      approverUserId: 7,
      workflowId: 3,
      workflowVersion: 1,
      nodeId: 'await',
      title: 'Test',
      workflowRun,
      workflowNodeDefs: [],
      workflowNodeOutputs: {},
      pendingWrite: {
        name: 'update_item',
        arguments: { id: 1 },
        riskLevel: 'L2',
      },
      scopedToolIds: [10],
      channel: { kind: 'page_action', pageActionRunId: 88 },
      pageActionRunId: 88,
      stepRecorder: recorder,
    });

    expect(approval.id).toBe(55);
    expect(approvalRequests.createPending).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'page_action',
        approverUserId: 7,
        resumeSnapshot: expect.objectContaining({
          version: 1,
          channel: { kind: 'page_action', pageActionRunId: 88 },
        }),
      }),
    );
    const steps = recorder.toJson();
    expect(steps.some((row) => row.name === 'awaiting_approval')).toBe(true);
  });

  it('buildPendingWriteFromTool trims tool name', () => {
    const service = new ApprovalGateService({} as ApprovalRequestService);
    expect(
      service.buildPendingWriteFromTool({
        name: '  write_tool  ',
        arguments: {},
        riskLevel: 'L3',
      }),
    ).toEqual({
      name: 'write_tool',
      arguments: {},
      riskLevel: 'L3',
    });
  });
});
