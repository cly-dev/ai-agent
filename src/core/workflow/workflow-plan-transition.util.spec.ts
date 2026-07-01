import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { initWorkflowRun } from './workflow-run.util';
import {
  applyPlanAdvanceAsWorkflowProgress,
  isWorkflowBoundRun,
} from './workflow-plan-transition.util';
import type { WorkflowNodeDef } from './workflow.types';

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch',
    input: {},
  },
  {
    id: 'compose',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose',
    input: {},
  },
];

function basePlan(): TaskPlanSnapshot {
  return {
    source: 'workflow',
    originalUserRequest: 'q',
    goal: 'q',
    deliverable: 'mutation',
    constraints: [],
    steps: [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        objective: 'Fetch',
        toolRole: 'read-detail',
      },
      {
        id: 'compose',
        phase: 'analyze',
        kind: 'tool',
        objective: 'Compose',
        toolRole: 'write-single',
      },
    ],
    pendingStepIds: ['fetch', 'compose'],
    completedStepIds: [],
    taskPhase: 'gather',
    currentObjective: 'Fetch',
    currentStepId: 'fetch',
    frames: [],
    activeFrameIndex: 0,
  };
}

describe('workflow-plan-transition.util', () => {
  it('isWorkflowBoundRun requires running workflow with current node', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'workflow_db',
    });
    expect(isWorkflowBoundRun(run)).toBe(true);
    expect(isWorkflowBoundRun({ ...run, status: 'completed' })).toBe(false);
  });

  it('applyPlanAdvanceAsWorkflowProgress projects plan from workflow after advance', () => {
    const workflowRun = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'workflow_db',
    });
    const planBefore = basePlan();
    const planAdvance = {
      updatedPlan: {
        ...planBefore,
        completedStepIds: ['fetch'],
        pendingStepIds: ['compose'],
        currentStepId: 'compose',
        currentObjective: 'Compose',
        taskPhase: 'analyze' as const,
      },
      route: 'llm' as const,
      reason: 'plan_advance_tool_step' as const,
    };
    const progressed = applyPlanAdvanceAsWorkflowProgress({
      taskPlan: planBefore,
      workflowRun,
      workflowNodeDefs: nodes,
      workflowAwaitingReact: true,
      planBefore,
      planAdvance,
      options: { clearWorkflowAwaitingReact: true },
    });
    expect(progressed.workflowRun?.currentNodeId).toBe('compose');
    expect(progressed.workflowRun?.nodes.find((r) => r.nodeId === 'fetch')?.status).toBe(
      'succeeded',
    );
    expect(progressed.taskPlan?.currentStepId).toBe('compose');
    expect(progressed.workflowAwaitingReact).toBe(false);
  });
});
