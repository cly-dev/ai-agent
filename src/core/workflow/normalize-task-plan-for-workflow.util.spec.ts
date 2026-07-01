import {
  inferDeliverableFromWorkflowNodes,
  normalizeTaskPlanSnapshotForWorkflow,
  normalizeTaskPlanStepsForWorkflow,
} from './normalize-task-plan-for-workflow.util';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowNodeDef } from './workflow.types';

const mutationNodes: WorkflowNodeDef[] = [
  {
    id: 'compose_mutation',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose',
    input: { toolId: 1 },
  },
  {
    id: 'await_confirm',
    action: 'await_user_confirm',
    name: 'Confirm',
    objective: 'Wait',
    input: {},
  },
  {
    id: 'write_data',
    action: 'write_data',
    name: 'Write',
    objective: 'Write',
    input: { toolId: 1 },
  },
];

describe('normalize-task-plan-for-workflow', () => {
  it('infers mutation deliverable from workflow nodes', () => {
    expect(inferDeliverableFromWorkflowNodes(mutationNodes)).toBe('mutation');
    expect(
      inferDeliverableFromWorkflowNodes([
        {
          id: 'answer',
          action: 'summarize',
          name: 'Answer',
          objective: 'Answer',
          input: {},
        },
      ]),
    ).toBe('answer');
  });

  it('upgrades legacy summarize await steps to workflow_gate', () => {
    const steps = normalizeTaskPlanStepsForWorkflow(
      [
        {
          id: 'await_confirm',
          kind: 'summarize',
          phase: 'answer',
          objective: 'Wait',
          stopWhen: 'always',
        },
      ],
      mutationNodes,
    );
    expect(steps[0]?.kind).toBe('workflow_gate');
  });

  it('normalizeTaskPlanSnapshotForWorkflow aligns deliverable and step kinds', () => {
    const plan: TaskPlanSnapshot = {
      source: 'workflow',
      originalUserRequest: 'reply',
      goal: 'reply',
      deliverable: 'answer',
      constraints: [],
      steps: [
        {
          id: 'await_confirm',
          kind: 'summarize',
          phase: 'answer',
          objective: 'Wait',
          stopWhen: 'always',
        },
      ],
      pendingStepIds: ['await_confirm'],
      completedStepIds: [],
      taskPhase: 'answer',
      currentObjective: 'Wait',
      currentStepId: 'await_confirm',
      frames: [],
      activeFrameIndex: 0,
    };
    const normalized = normalizeTaskPlanSnapshotForWorkflow({
      plan,
      nodes: mutationNodes,
    });
    expect(normalized.deliverable).toBe('mutation');
    expect(normalized.steps[0]?.kind).toBe('workflow_gate');
  });
});
