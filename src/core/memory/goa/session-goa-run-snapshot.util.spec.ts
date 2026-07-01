import {
  buildAgentRunGoaSnapshot,
  parseAgentRunGoaSnapshot,
} from './session-goa-run-snapshot.util';
import { initWorkflowRun } from '../../workflow/workflow-run.util';
import type { WorkflowNodeDef } from '../../workflow/workflow.types';
import type { StoredTaskPlan } from './session-goa.types';

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch',
    input: {},
  },
];

const storedTaskPlan: StoredTaskPlan = {
  source: 'template',
  originalUserRequest: 'q',
  goal: 'q',
  deliverable: 'answer',
  constraints: [],
  steps: [
    {
      id: 'fetch',
      phase: 'gather',
      kind: 'tool',
      objective: 'Fetch',
    },
  ],
  pendingStepIds: ['fetch'],
  completedStepIds: [],
  taskPhase: 'gather',
  currentObjective: 'Fetch',
  currentStepId: 'fetch',
};

describe('session-goa-run-snapshot.util workflowRun', () => {
  it('buildAgentRunGoaSnapshot includes workflowRun from graph state', () => {
    const workflowRun = initWorkflowRun({
      workflowId: 11,
      version: 4,
      nodes,
      compiledFrom: 'workflow_db',
    });
    const snapshot = buildAgentRunGoaSnapshot({
      graphState: {
        taskPlan: {
          source: 'template',
          originalUserRequest: 'q',
          goal: 'q',
          deliverable: 'answer',
          constraints: [],
          steps: [],
          pendingStepIds: ['fetch'],
          completedStepIds: [],
          taskPhase: 'gather',
          currentObjective: 'Fetch',
          currentStepId: 'fetch',
          frames: [],
          activeFrameIndex: 0,
        },
        intentKind: 'task',
        awaitingWriteConfirmation: false,
        status: 'running' as never,
        workflowRun,
      },
    });
    expect(snapshot?.workflowRun).toEqual(workflowRun);
  });

  it('parseAgentRunGoaSnapshot round-trips workflowRun', () => {
    const workflowRun = initWorkflowRun({
      workflowId: 2,
      version: 1,
      nodes,
      compiledFrom: 'resume',
    });
    const parsed = parseAgentRunGoaSnapshot({
      storedTaskPlan,
      activeTaskStatus: 'in_progress',
      workflowRun,
      capturedAt: '2026-06-24T00:00:00.000Z',
    });
    expect(parsed?.workflowRun).toEqual(workflowRun);
  });

  it('parseAgentRunGoaSnapshot drops invalid workflowRun', () => {
    const parsed = parseAgentRunGoaSnapshot({
      storedTaskPlan,
      activeTaskStatus: 'in_progress',
      workflowRun: { bad: true },
    });
    expect(parsed?.workflowRun).toBeUndefined();
  });
});
