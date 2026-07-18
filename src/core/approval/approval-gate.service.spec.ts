import { ApprovalGateService } from './approval-gate.service';
import type { ApprovalRequestService } from './approval-request.service';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import { buildPageWriteDraft } from '../draft-review/write-draft.util';
import type { WorkflowRunState } from '../workflow/workflow.types';

describe('ApprovalGateService', () => {
  const workflowRun: WorkflowRunState = {
    workflowId: 3,
    version: 1,
    status: 'running',
    currentNodeId: 'await',
    compiledFrom: 'flow_db',
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
      flowId: 3,
      flowVersion: 1,
      nodeId: 'await',
      title: 'Test',
      workflowRun,
      workflowNodeDefs: [],
      workflowNodeOutputs: {},
      writeDraft: buildPageWriteDraft({
        tool: {
          name: 'update_item',
          riskLevel: 'L2',
          arguments: { id: 1 },
        },
        lastEvent: 'suspended',
      }),
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
        flowId: 3,
        resumeSnapshot: expect.objectContaining({
          version: 2,
          flow: { id: 3, version: 1 },
          suspended: expect.objectContaining({ irNodeId: 'await' }),
          channel: { kind: 'page_action', pageActionRunId: 88 },
          writeDraft: expect.objectContaining({
            tool: expect.objectContaining({ name: 'update_item' }),
          }),
        }),
      }),
    );
    const steps = recorder.toJson();
    expect(steps.some((row) => row.name === 'awaiting_approval')).toBe(true);
  });
});
