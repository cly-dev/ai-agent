import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import {
  PLAN_COMPOSE_WRITE_STEP_ID,
  PLAN_PRESENT_STEP_ID,
  PLAN_WRITE_STEP_ID,
} from '../agent-engine/engine/main/plan/task-plan.util';
import {
  compileTaskPlanToWorkflow,
  compileTaskPlanToWorkflowNodes,
} from './compile-plan-to-workflow.util';

function samplePlan(
  overrides: Partial<TaskPlanSnapshot> = {},
): TaskPlanSnapshot {
  return {
    source: 'llm',
    originalUserRequest: 'list campaigns',
    goal: 'list campaigns',
    deliverable: 'list',
    constraints: [],
    steps: [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-list',
        objective: 'fetch list',
        stopWhen: 'observation_non_empty',
      },
      {
        id: 'answer',
        phase: 'answer',
        kind: 'summarize',
        objective: 'summarize list',
        stopWhen: 'always',
      },
    ],
    pendingStepIds: ['fetch', 'answer'],
    completedStepIds: [],
    taskPhase: 'gather',
    currentObjective: 'fetch list',
    currentStepId: 'fetch',
    frames: [],
    activeFrameIndex: 0,
    ...overrides,
  };
}

describe('compile-plan-to-workflow', () => {
  it('maps gather tool + summarize to fetch_data + summarize', () => {
    const nodes = compileTaskPlanToWorkflowNodes(samplePlan().steps);
    expect(nodes.map((node) => node.action)).toEqual([
      'fetch_data',
      'summarize',
    ]);
    expect(nodes[0]?.id).toBe('fetch');
  });

  it('initializes workflowRun with plan_llm compiledFrom', () => {
    const compiled = compileTaskPlanToWorkflow({ plan: samplePlan() });
    expect(compiled?.compiledFrom).toBe('plan_llm');
    expect(compiled?.workflowRun.currentNodeId).toBe('fetch');
    expect(compiled?.workflowRun.nodes).toHaveLength(2);
  });

  it('maps template source to compiledFrom template', () => {
    const compiled = compileTaskPlanToWorkflow({
      plan: samplePlan({ source: 'template' }),
    });
    expect(compiled?.compiledFrom).toBe('template');
  });

  it('maps mutation template to compose/present/await/write nodes', () => {
    const mutationPlan: TaskPlanSnapshot = {
      source: 'template',
      originalUserRequest: 'update campaign',
      goal: 'update campaign',
      deliverable: 'mutation',
      constraints: [],
      steps: [
        {
          id: PLAN_COMPOSE_WRITE_STEP_ID,
          phase: 'analyze',
          kind: 'tool',
          toolRole: 'write-single',
          objective: 'compose write args',
        },
        {
          id: PLAN_PRESENT_STEP_ID,
          phase: 'answer',
          kind: 'summarize',
          objective: 'present draft',
          stopWhen: 'always',
        },
        {
          id: PLAN_WRITE_STEP_ID,
          phase: 'mutate',
          kind: 'tool',
          toolRole: 'write-single',
          objective: 'execute write',
          stopWhen: 'observation_non_empty',
        },
        {
          id: 'confirm',
          phase: 'answer',
          kind: 'summarize',
          objective: 'summarize result',
          stopWhen: 'always',
        },
      ],
      pendingStepIds: [PLAN_COMPOSE_WRITE_STEP_ID],
      completedStepIds: [],
      taskPhase: 'analyze',
      currentObjective: 'compose write args',
      currentStepId: PLAN_COMPOSE_WRITE_STEP_ID,
      frames: [],
      activeFrameIndex: 0,
    };
    const nodes = compileTaskPlanToWorkflowNodes(mutationPlan.steps);
    expect(nodes.map((node) => node.action)).toEqual([
      'compose_mutation',
      'present_mutation',
      'await_user_confirm',
      'write_data',
      'summarize',
    ]);
    expect(nodes[2]?.id).toBe(`${PLAN_WRITE_STEP_ID}_await`);
  });
});
