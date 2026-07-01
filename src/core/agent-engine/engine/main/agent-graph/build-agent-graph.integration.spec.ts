import { AgentRunStatus } from '../../../../../../generated/prisma/client';
import { buildAndRunAgentGraph } from './build-agent-graph';
import {
  buildWorkflowGraphRunInput,
  buildWorkflowResumeGraphInitialState,
  createMockAgentGraphDeps,
  SUMMARIZE_REPLY,
} from './test-fixture/agent-graph.integration-fixture';
import {
  fetchSummarizeWorkflowNodes,
  seedFetchSummarizeWorkflowState,
  seedWorkflowGraphState,
  workflowGraphFixtureNodes,
} from '../../../../workflow/workflow-graph-fixture.util';
import { completeWorkflowNode, initWorkflowRun } from '../../../../workflow/workflow-run.util';

describe('buildAndRunAgentGraph integration', () => {
  it('resume entry continues fetch→answer workflow after react completed (seeded)', async () => {
    const deps = createMockAgentGraphDeps();
    const seeded = seedFetchSummarizeWorkflowState();
    let workflowRun = seeded.workflowRun!;
    workflowRun = completeWorkflowNode(
      workflowRun,
      'fetch',
      'obs:fetch_data:fetch',
    );
    workflowRun = { ...workflowRun, currentNodeId: 'answer' };
    workflowRun = {
      ...workflowRun,
      nodes: workflowRun.nodes.map((row) =>
        row.nodeId === 'answer'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };

    const result = await buildAndRunAgentGraph(
      deps,
      buildWorkflowGraphRunInput({
        ...seeded,
        workflowRun,
        workflowNodeDefs: fetchSummarizeWorkflowNodes,
        workflowNodeOutputs: {
          'obs:fetch_data:fetch': { data: { id: '43689' } },
        },
        taskPlan: {
          ...seeded.taskPlan!,
          completedStepIds: ['fetch'],
          pendingStepIds: ['answer'],
          currentStepId: 'answer',
          currentObjective: 'Summarize result',
          taskPhase: 'answer',
        },
        finished: false,
        steps: [],
      }),
    );

    expect(result.finished).toBe(true);
    expect(result.workflowRun?.status).toBe('completed');
    expect(
      result.workflowRun?.nodes.find((row) => row.nodeId === 'answer')?.status,
    ).toBe('succeeded');
  });

  it('resume entry runs load_page_context → workflow_advance → summarize to completion', async () => {
    const deps = createMockAgentGraphDeps();
    const graphInitialState = buildWorkflowResumeGraphInitialState();

    const result = await buildAndRunAgentGraph(
      deps,
      buildWorkflowGraphRunInput(graphInitialState),
    );

    expect(result.finished).toBe(true);
    expect(result.status).toBe(AgentRunStatus.success);
    expect(result.workflowRun?.status).toBe('completed');
    expect(
      result.workflowRun?.nodes.find((row) => row.nodeId === 'load')?.status,
    ).toBe('succeeded');
    expect(
      result.workflowRun?.nodes.find((row) => row.nodeId === 'answer')?.status,
    ).toBe('succeeded');
    expect(result.steps.some((row) => row.type === 'workflow')).toBe(true);
    expect(result.steps.some((row) => row.type === 'summarize')).toBe(true);
    expect(result.workflowNodeOutputs?.['obs:load_page_context:load']).toBeDefined();
    expect(result.finalOutput).toContain(SUMMARIZE_REPLY);
    expect(deps.prisma.agentRun.update).toHaveBeenCalled();
    expect(deps.sse.summarizeMessageBlocks).toHaveBeenCalled();
  });

  it('resume entry at workflow_advance after load completes and advances to answer', async () => {
    const deps = createMockAgentGraphDeps();
    const seeded = seedWorkflowGraphState();
    let workflowRun = seeded.workflowRun!;
    workflowRun = completeWorkflowNode(
      workflowRun,
      'load',
      'obs:load_page_context:load',
    );
    workflowRun = { ...workflowRun, currentNodeId: 'answer' };
    workflowRun = {
      ...workflowRun,
      nodes: workflowRun.nodes.map((row) =>
        row.nodeId === 'answer'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };

    const result = await buildAndRunAgentGraph(
      deps,
      buildWorkflowGraphRunInput({
        ...seeded,
        workflowRun,
        workflowNodeDefs: workflowGraphFixtureNodes,
        workflowNodeOutputs: {
          'obs:load_page_context:load': { page: 'home', hasInlineContent: false },
        },
        taskPlan: {
          ...seeded.taskPlan!,
          completedStepIds: ['load'],
          pendingStepIds: ['answer'],
          currentStepId: 'answer',
          currentObjective: 'Explain page',
          taskPhase: 'answer',
        },
        finished: false,
        steps: [],
      }),
    );

    expect(result.finished).toBe(true);
    expect(result.workflowRun?.status).toBe('completed');
    expect(
      result.workflowRun?.nodes.find((row) => row.nodeId === 'answer')?.status,
    ).toBe('succeeded');
    expect(deps.sse.summarizeMessageBlocks).toHaveBeenCalled();
  });

  it('resume entry advances from succeeded load through answer summarize to completed workflow', async () => {
    const deps = createMockAgentGraphDeps();
    const nodes = workflowGraphFixtureNodes;
    let workflowRun = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'workflow_db',
    });
    workflowRun = completeWorkflowNode(
      workflowRun,
      'load',
      'obs:load_page_context:load',
    );
    workflowRun = {
      ...workflowRun,
      currentNodeId: 'load',
      nodes: workflowRun.nodes.map((row) =>
        row.nodeId === 'load'
          ? { ...row, status: 'succeeded' as const }
          : row,
      ),
    };

    const result = await buildAndRunAgentGraph(
      deps,
      buildWorkflowGraphRunInput({
        ...seedWorkflowGraphState(),
        workflowRun,
        workflowNodeDefs: nodes,
        workflowNodeOutputs: {
          'obs:load_page_context:load': { page: 'home' },
        },
        finished: false,
        steps: [],
      }),
    );

    expect(result.finished).toBe(true);
    expect(result.workflowRun?.status).toBe('completed');
    expect(result.workflowRun?.currentNodeId).toBeNull();
    expect(
      result.workflowRun?.nodes.find((row) => row.nodeId === 'answer')?.status,
    ).toBe('succeeded');
  });
});
