import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import {
  compileTaskPlanFromWorkflow,
  compileTaskPlanFromWorkflowNodes,
} from './compile-task-plan-from-workflow.util';
import { compileTaskPlanToWorkflowNodes } from './compile-plan-to-workflow.util';
import type { WorkflowNodeDef } from './workflow.types';

const skill2MutationNodes: WorkflowNodeDef[] = [
  {
    id: 'fetch_before_write',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch review detail',
    input: { toolId: 1 },
  },
  {
    id: 'compose_mutation',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose reply args',
    input: { toolId: 2 },
  },
  {
    id: 'present_mutation',
    action: 'present_mutation',
    name: 'Present',
    objective: 'Present draft',
    input: {},
  },
  {
    id: 'await_confirm',
    action: 'await_user_confirm',
    name: 'Confirm',
    objective: 'Wait for confirmation',
    input: { confirmKind: 'mutation' },
  },
  {
    id: 'write_data',
    action: 'write_data',
    name: 'Write',
    objective: 'Submit reply',
    input: { toolId: 2 },
  },
  {
    id: 'summarize',
    action: 'summarize',
    name: 'Summarize',
    objective: 'Summarize outcome',
    input: { mode: 'final' },
  },
];

describe('compile-task-plan-from-workflow', () => {
  it('maps await_user_confirm to workflow_gate (not summarize)', () => {
    const steps = compileTaskPlanFromWorkflowNodes(skill2MutationNodes);
    const awaitStep = steps.find((row) => row.id === 'await_confirm');
    expect(awaitStep?.kind).toBe('workflow_gate');
    expect(awaitStep?.phase).toBe('answer');
    expect(awaitStep?.stopWhen).toBe('always');
  });

  it('maps mutation workflow nodes to expected plan step kinds', () => {
    const steps = compileTaskPlanFromWorkflowNodes(skill2MutationNodes);
    expect(steps.map((row) => `${row.id}:${row.kind}`)).toEqual([
      'fetch_before_write:tool',
      'compose_mutation:tool',
      'present_mutation:summarize',
      'await_confirm:workflow_gate',
      'write_data:tool',
      'summarize:summarize',
    ]);
  });

  it('round-trips workflow_gate back to await_user_confirm workflow node', () => {
    const steps = compileTaskPlanFromWorkflowNodes(skill2MutationNodes);
    const nodes = compileTaskPlanToWorkflowNodes(steps);
    expect(nodes.map((row) => row.action)).toEqual([
      'fetch_data',
      'compose_mutation',
      'present_mutation',
      'await_user_confirm',
      'write_data',
      'summarize',
    ]);
    expect(nodes.find((row) => row.action === 'await_user_confirm')?.id).toBe(
      'await_confirm',
    );
  });

  it('compileTaskPlanFromWorkflow initializes pending queue from compiled steps', () => {
    const plan = compileTaskPlanFromWorkflow({
      nodes: skill2MutationNodes,
      originalUserRequest: 'reviewId 43690 自动回复',
    });
    expect(plan?.source).toBe('workflow');
    expect(plan?.deliverable).toBe('mutation');
    expect(plan?.pendingStepIds[0]).toBe('fetch_before_write');
    expect(plan?.steps.some((row) => row.kind === 'workflow_gate')).toBe(true);
  });
});
