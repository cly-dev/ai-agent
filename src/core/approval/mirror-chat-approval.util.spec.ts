import { PLAN_COMPOSE_WRITE_OBSERVATION_NAME } from '../agent-engine/engine/main/plan-present/plan-compose-write.util';
import type { ApprovalGateService } from './approval-gate.service';
import type { ApprovalRequestService } from './approval-request.service';
import { mirrorChatApprovalRequest } from './mirror-chat-approval.util';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';

describe('mirrorChatApprovalRequest', () => {
  const workflowRun: WorkflowRunState = {
    workflowId: 2,
    version: 1,
    status: 'running',
    currentNodeId: 'await',
    compiledFrom: 'workflow_db',
    nodes: [],
  };

  const baseInput = {
    appClientId: 1,
    userId: 7,
    sessionId: 'sess_1',
    runId: 101,
    turnId: 55,
    nodeId: 'await',
    workflowRun,
    workflowNodeDefs: [
      {
        id: 'await',
        action: 'await_user_confirm',
        name: 'Confirm',
        objective: '',
        input: {},
      },
    ] as WorkflowNodeDef[],
    workflowNodeOutputs: {},
    scopedTools: [{ id: 10, name: 'update_item', riskLevel: 'L2' } as never],
    pageContext: null,
    resumeContext: {
      steps: [],
      iteration: 1,
      toolObservations: [],
      scopedToolIds: [10],
      intentKind: 'task' as const,
      hasExpandedOnce: false,
    },
  };

  it('returns existing pending id by idempotency key', async () => {
    const approvalRequests = {
      findPendingByIdempotencyKey: jest.fn().mockResolvedValue({ id: 99 }),
    } as unknown as ApprovalRequestService;
    const approvalGate = {} as ApprovalGateService;

    const id = await mirrorChatApprovalRequest({
      ...baseInput,
      approvalGate,
      approvalRequests,
      observations: [],
    });

    expect(id).toBe(99);
  });

  it('creates mirrored approval from plan_compose_write', async () => {
    const approvalRequests = {
      findPendingByIdempotencyKey: jest.fn().mockResolvedValue(null),
    } as unknown as ApprovalRequestService;
    const suspend = jest.fn().mockResolvedValue({ id: 12 });
    const approvalGate = {
      suspend,
      buildPendingWriteFromTool: jest.fn().mockReturnValue({
        name: 'update_item',
        arguments: { body: 'x' },
        riskLevel: 'L2',
      }),
    } as unknown as ApprovalGateService;

    const id = await mirrorChatApprovalRequest({
      ...baseInput,
      approvalGate,
      approvalRequests,
      observations: [
        {
          name: PLAN_COMPOSE_WRITE_OBSERVATION_NAME,
          output: {
            tool: 'update_item',
            arguments: { body: 'x' },
          },
        },
      ],
    });

    expect(id).toBe(12);
    expect(suspend).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'chat',
        idempotencyKey: 'chat:sess_1:101:await',
        channel: expect.objectContaining({
          kind: 'chat',
          sessionId: 'sess_1',
          runId: 101,
        }),
      }),
    );
  });

  it('returns null when compose observation missing', async () => {
    const approvalRequests = {
      findPendingByIdempotencyKey: jest.fn().mockResolvedValue(null),
    } as unknown as ApprovalRequestService;

    const id = await mirrorChatApprovalRequest({
      ...baseInput,
      approvalGate: { suspend: jest.fn() } as unknown as ApprovalGateService,
      approvalRequests,
      observations: [],
    });

    expect(id).toBeNull();
  });
});
