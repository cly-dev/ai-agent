import {
  newlyCompletedPlanStepIds,
  projectTaskPlanFromWorkflowAdvance,
  projectTaskPlanFromWorkflowRun,
  syncTaskPlanAfterWorkflowNodeComplete,
  syncWorkflowRunAfterPlanAdvance,
  workflowNodeRequiresReactLoop,
} from './workflow-plan-sync.util';
import { initWorkflowRun } from './workflow-run.util';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
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
    id: 'summarize',
    action: 'summarize',
    name: 'Summarize',
    objective: 'Answer',
    input: {},
  },
];

function basePlan(): TaskPlanSnapshot {
  return {
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
      {
        id: 'summarize',
        phase: 'answer',
        kind: 'summarize',
        objective: 'Answer',
      },
    ],
    pendingStepIds: ['fetch', 'summarize'],
    completedStepIds: [],
    taskPhase: 'gather',
    currentObjective: 'Fetch',
    currentStepId: 'fetch',
    frames: [],
    activeFrameIndex: 0,
  };
}

describe('workflow-plan-sync.util', () => {
  it('newlyCompletedPlanStepIds returns ids added to completedStepIds', () => {
    const before = basePlan();
    const after = {
      ...before,
      completedStepIds: ['fetch'],
      pendingStepIds: ['summarize'],
      currentStepId: 'summarize',
    };
    expect(newlyCompletedPlanStepIds(before, after)).toEqual(['fetch']);
  });

  it('syncWorkflowRunAfterPlanAdvance completes nodes and advances currentNodeId', () => {
    const workflowRun = initWorkflowRun({
      workflowId: 0,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    const planBefore = basePlan();
    const planAfter = {
      ...planBefore,
      completedStepIds: ['fetch'],
      pendingStepIds: ['summarize'],
      currentStepId: 'summarize',
      currentObjective: 'Answer',
      taskPhase: 'answer' as const,
    };
    const synced = syncWorkflowRunAfterPlanAdvance({
      workflowRun,
      planBefore,
      planAdvance: {
        updatedPlan: planAfter,
        route: 'summarize',
        reason: 'step_complete',
      },
    });
    const fetchNode = synced.nodes.find((row) => row.nodeId === 'fetch');
    expect(fetchNode?.status).toBe('succeeded');
    expect(synced.currentNodeId).toBe('summarize');
  });

  it('projectTaskPlanFromWorkflowRun merges workflow completed with prior plan completed', () => {
    const workflowRun = initWorkflowRun({
      workflowId: 0,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    const runAfterFetch = {
      ...workflowRun,
      currentNodeId: 'summarize',
      nodes: workflowRun.nodes.map((row) =>
        row.nodeId === 'fetch'
          ? { ...row, status: 'succeeded' as const }
          : row,
      ),
    };
    const planBefore = basePlan();
    const projected = projectTaskPlanFromWorkflowRun({
      taskPlan: planBefore,
      workflowRun: runAfterFetch,
      workflowNodeDefs: nodes,
    });
    expect(projected?.completedStepIds).toContain('fetch');
    expect(projected?.currentStepId).toBe('summarize');
    expect(projected?.pendingStepIds).toEqual(['summarize']);
  });

  it('projectTaskPlanFromWorkflowAdvance mirrors syncTaskPlanAfterWorkflowNodeComplete', () => {
    const planBefore = basePlan();
    const projected = projectTaskPlanFromWorkflowAdvance({
      taskPlan: planBefore,
      completedNodeId: 'fetch',
    });
    const synced = syncTaskPlanAfterWorkflowNodeComplete({
      taskPlan: planBefore,
      completedNodeId: 'fetch',
    });
    expect(projected).toEqual(synced);
  });

  it('syncTaskPlanAfterWorkflowNodeComplete marks step done and advances plan', () => {
    const planBefore = basePlan();
    const synced = syncTaskPlanAfterWorkflowNodeComplete({
      taskPlan: planBefore,
      completedNodeId: 'fetch',
    });
    expect(synced?.completedStepIds).toContain('fetch');
    expect(synced?.currentStepId).toBe('summarize');
  });

  it('workflowNodeRequiresReactLoop includes mutation compose and write', () => {
    expect(
      workflowNodeRequiresReactLoop({
        id: 'c',
        action: 'compose_mutation',
        name: 'Compose',
        objective: 'Compose',
        input: {},
      }),
    ).toBe(true);
    expect(
      workflowNodeRequiresReactLoop({
        id: 'p',
        action: 'present_mutation',
        name: 'Present',
        objective: 'Present',
        input: {},
      }),
    ).toBe(false);
  });
});
