import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import {
  advanceWorkflowRunAfterWriteConfirm,
  buildWorkflowResumeGraphSlice,
  isResumableWorkflowRun,
  shouldAwaitReactOnWorkflowResume,
} from './workflow-resume.util';
import { initWorkflowRun } from './workflow-run.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch data',
    input: { toolId: 1 },
  },
  {
    id: 'summarize',
    action: 'summarize',
    name: 'Summarize',
    objective: 'Answer',
    input: {},
  },
];

function buildRunningRun(currentNodeId: string): WorkflowRunState {
  let run = initWorkflowRun({
    workflowId: 9,
    version: 2,
    nodes,
    compiledFrom: 'workflow_db',
  });
  if (currentNodeId !== 'fetch') {
    run = {
      ...run,
      currentNodeId,
      nodes: run.nodes.map((row) =>
        row.nodeId === 'fetch'
          ? { ...row, status: 'succeeded' as const }
          : row,
      ),
    };
  }
  return run;
}

describe('workflow-resume.util', () => {
  it('isResumableWorkflowRun rejects completed runs', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    const completed = { ...run, status: 'completed' as const, currentNodeId: null };
    expect(isResumableWorkflowRun(completed)).toBe(false);
    expect(isResumableWorkflowRun(run)).toBe(true);
    expect(isResumableWorkflowRun(null)).toBe(false);
  });

  it('shouldAwaitReactOnWorkflowResume is true for running fetch_data node', () => {
    const run = buildRunningRun('fetch');
    const running = {
      ...run,
      nodes: run.nodes.map((row) =>
        row.nodeId === 'fetch' ? { ...row, status: 'running' as const } : row,
      ),
    };
    expect(shouldAwaitReactOnWorkflowResume(running, nodes)).toBe(true);
  });

  it('shouldAwaitReactOnWorkflowResume is false for pending summarize node', () => {
    const run = buildRunningRun('summarize');
    expect(shouldAwaitReactOnWorkflowResume(run, nodes)).toBe(false);
  });

  it('buildWorkflowResumeGraphSlice preserves saved run and defs', () => {
    const savedRun = buildRunningRun('summarize');
    const slice = buildWorkflowResumeGraphSlice({ savedRun, nodes });
    expect(slice.workflowRun).toBe(savedRun);
    expect(slice.workflowNodeDefs).toEqual(nodes);
    expect(slice.workflowAwaitingReact).toBe(false);
  });

  it('advanceWorkflowRunAfterWriteConfirm completes await_user_confirm and advances', () => {
    const mutationNodes: WorkflowNodeDef[] = [
      {
        id: 'confirm',
        action: 'await_user_confirm',
        name: 'Confirm',
        objective: 'Wait',
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
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: mutationNodes,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'confirm',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'confirm'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };
    const advanced = advanceWorkflowRunAfterWriteConfirm(run);
    const confirm = advanced.nodes.find((row) => row.nodeId === 'confirm');
    expect(confirm?.status).toBe('succeeded');
    expect(advanced.currentNodeId).toBe('summarize');
  });
});

describe('resolveWorkflowDefsForResume', () => {
  it('falls back to plan compile when workflowId is zero', async () => {
    const { resolveWorkflowDefsForResume } = await import('./workflow-resume.util');
    const savedRun = initWorkflowRun({
      workflowId: 0,
      version: 1,
      nodes,
      compiledFrom: 'resume',
    });
    const plan = {
      source: 'template',
      originalUserRequest: 'hi',
      goal: 'hi',
      deliverable: 'answer',
      constraints: [],
      steps: [
        {
          id: 'fetch',
          phase: 'gather',
          kind: 'tool',
          objective: 'Fetch data',
        },
        {
          id: 'summarize',
          phase: 'answer',
          kind: 'summarize',
          objective: 'Answer',
        },
      ],
      pendingStepIds: ['fetch'],
      completedStepIds: [],
      taskPhase: 'gather',
      currentObjective: 'Fetch data',
      currentStepId: 'fetch',
      frames: [],
      activeFrameIndex: 0,
    } satisfies TaskPlanSnapshot;

    const defs = await resolveWorkflowDefsForResume(
      {} as never,
      {
        savedRun,
        taskPlan: plan,
        appClientId: 1,
      },
    );
    expect(defs?.map((row) => row.id)).toEqual(['fetch', 'summarize']);
  });
});
