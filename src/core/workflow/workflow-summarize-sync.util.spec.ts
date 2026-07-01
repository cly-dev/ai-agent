import {
  applyWorkflowAfterSummarize,
  mergeWorkflowExecutorOutcome,
} from './workflow-summarize-sync.util';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { initWorkflowRun } from './workflow-run.util';
import type { WorkflowNodeDef } from './workflow.types';

const mutationNodes: WorkflowNodeDef[] = [
  {
    id: 'compose',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose',
    input: { toolId: 1 },
  },
  {
    id: 'present',
    action: 'present_mutation',
    name: 'Present',
    objective: 'Present',
    input: {},
  },
  {
    id: 'await',
    action: 'await_user_confirm',
    name: 'Confirm',
    objective: 'Wait',
    input: {},
  },
  {
    id: 'write',
    action: 'write_data',
    name: 'Write',
    objective: 'Write',
    input: { toolId: 1 },
  },
];

describe('workflow-summarize-sync.util', () => {
  it('mergeWorkflowExecutorOutcome archives node output by outputRef', () => {
    const state = {
      workflowRun: { currentNodeId: 'fetch' },
      workflowNodeOutputs: { 'obs:old': { x: 1 } },
    } as unknown as AgentGraphState;

    const next = mergeWorkflowExecutorOutcome(state, {
      workflowRun: { currentNodeId: 'fetch', status: 'running' } as never,
      outputRef: 'obs:fetch_data:fetch',
      nodeOutput: { toolId: 1 },
    });

    expect(next.workflowNodeOutputs).toEqual({
      'obs:old': { x: 1 },
      'obs:fetch_data:fetch': { toolId: 1 },
    });
  });

  it('applyWorkflowAfterSummarize completes summarize node when finished', () => {
    const state = {
      workflowRun: {
        currentNodeId: 'answer',
        status: 'running',
        nodes: [
          {
            nodeId: 'answer',
            action: 'summarize',
            status: 'running',
          },
        ],
      },
      workflowNodeDefs: [
        {
          id: 'answer',
          action: 'summarize',
          name: 'Answer',
          objective: 'Answer',
          input: {},
        },
      ],
    } as unknown as AgentGraphState;

    const patch = applyWorkflowAfterSummarize(state, {
      continuePlan: false,
      finished: true,
    });

    expect(patch.workflowRun?.nodes[0]?.status).toBe('succeeded');
    expect(patch.workflowRun?.status).toBe('completed');
    expect(patch.workflowRun?.currentNodeId).toBeNull();
    expect(patch.workflowAwaitingReact).toBe(false);
  });

  it('applyWorkflowAfterSummarize completes present_mutation and advances to await_user_confirm while plan continues', () => {
    let run = initWorkflowRun({
      workflowId: 2,
      version: 1,
      nodes: mutationNodes,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'present',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'present'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };
    const state = {
      workflowRun: run,
      workflowNodeDefs: mutationNodes,
    } as unknown as AgentGraphState;

    const patch = applyWorkflowAfterSummarize(state, {
      continuePlan: true,
      finished: false,
    });

    expect(patch.workflowRun?.nodes.find((row) => row.nodeId === 'present')?.status).toBe(
      'succeeded',
    );
    expect(patch.workflowRun?.currentNodeId).toBe('await');
    expect(
      patch.workflowRun?.nodes.find((row) => row.nodeId === 'await')?.status,
    ).toBe('pending');
  });

  it('applyWorkflowAfterSummarize aligns lagging workflow from compose to present via summarizedPlanStepId', () => {
    let run = initWorkflowRun({
      workflowId: 2,
      version: 1,
      nodes: mutationNodes,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'compose',
      nodes: run.nodes.map((row) => {
        if (row.nodeId === 'fetch_before_write' || row.nodeId === 'compose') {
          return { ...row, status: 'running' as const };
        }
        return row;
      }),
    };
    const state = {
      workflowRun: run,
      workflowNodeDefs: mutationNodes,
    } as unknown as AgentGraphState;

    const patch = applyWorkflowAfterSummarize(state, {
      continuePlan: true,
      finished: false,
      summarizedPlanStepId: 'present',
    });

    expect(patch.workflowRun?.nodes.find((row) => row.nodeId === 'compose')?.status).toBe(
      'succeeded',
    );
    expect(patch.workflowRun?.nodes.find((row) => row.nodeId === 'present')?.status).toBe(
      'succeeded',
    );
    expect(patch.workflowRun?.currentNodeId).toBe('await');
  });

  it('applyWorkflowAfterSummarize does not advance summarize node while plan continues', () => {
    const state = {
      workflowRun: {
        currentNodeId: 'answer',
        status: 'running',
        nodes: [
          {
            nodeId: 'answer',
            action: 'summarize',
            status: 'running',
          },
        ],
      },
      workflowNodeDefs: [
        {
          id: 'answer',
          action: 'summarize',
          name: 'Answer',
          objective: 'Answer',
          input: {},
        },
      ],
    } as unknown as AgentGraphState;

    const patch = applyWorkflowAfterSummarize(state, {
      continuePlan: true,
      finished: false,
    });

    expect(patch).toEqual({});
  });
});
