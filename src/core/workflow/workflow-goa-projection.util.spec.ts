import {
  buildStepProgressFromWorkflowRun,
  formatWorkflowRunPendingSummary,
  resolveActiveTaskStatusFromWorkflow,
} from './workflow-goa-projection.util';
import { initWorkflowRun } from './workflow-run.util';
import type { WorkflowNodeDef } from './workflow.types';
import type { StoredTaskPlan } from '../memory/goa/session-goa.types';

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch',
    input: {},
  },
  {
    id: 'answer',
    action: 'summarize',
    name: 'Answer',
    objective: 'Answer',
    input: {},
  },
];

const plan: StoredTaskPlan = {
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
      id: 'answer',
      phase: 'answer',
      kind: 'summarize',
      objective: 'Answer',
    },
  ],
  pendingStepIds: ['answer'],
  completedStepIds: ['fetch'],
  taskPhase: 'answer',
  currentObjective: 'Answer',
  currentStepId: 'answer',
};

describe('workflow-goa-projection.util', () => {
  it('buildStepProgressFromWorkflowRun maps node statuses', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'answer',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'fetch'
          ? { ...row, status: 'succeeded', outputRef: 'obs:fetch' }
          : { ...row, status: 'running' },
      ),
    };

    const progress = buildStepProgressFromWorkflowRun({ workflowRun: run, plan });
    expect(progress).toEqual([
      {
        stepId: 'fetch',
        phase: 'gather',
        kind: 'tool',
        status: 'done',
        artifactRef: 'obs:fetch',
      },
      {
        stepId: 'answer',
        phase: 'answer',
        kind: 'summarize',
        status: 'running',
      },
    ]);
  });

  it('resolveActiveTaskStatusFromWorkflow reads workflow terminal state', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    expect(
      resolveActiveTaskStatusFromWorkflow({
        workflowRun: { ...run, status: 'completed', currentNodeId: null },
        plan,
      }),
    ).toBe('completed');
    expect(
      resolveActiveTaskStatusFromWorkflow({
        workflowRun: { ...run, status: 'failed' },
        plan,
        runStatus: 'success',
      }),
    ).toBe('failed');
  });

  it('formatWorkflowRunPendingSummary includes current node', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'resume',
    });
    const text = formatWorkflowRunPendingSummary(run);
    expect(text).toContain('current=fetch');
    expect(text).toContain('workflowStatus=running');
  });
});
