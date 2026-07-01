import { createExecuteNodeNode } from '../agent-engine/engine/main/agent-graph/nodes/execute-node.node';
import { createWorkflowAdvanceNode } from '../agent-engine/engine/main/agent-graph/nodes/workflow-advance.node';
import {
  routeAfterExecuteNode,
  routeAfterWorkflowAdvance,
  routeAfterWorkflowInit,
} from './workflow-graph-routing.util';
import {
  createMinimalAgentGraphBundle,
  seedWorkflowGraphState,
  workflowGraphFixtureNodes,
} from './workflow-graph-fixture.util';
import { compileTaskPlanToWorkflow } from './compile-plan-to-workflow.util';

describe('workflow graph integration (node chain)', () => {
  it('execute_node completes load_page_context and workflow_advance syncs taskPlan', async () => {
    const bundle = createMinimalAgentGraphBundle();
    const executeNode = createExecuteNodeNode(bundle);
    const advanceNode = createWorkflowAdvanceNode(bundle);

    let state = seedWorkflowGraphState();
    expect(state.workflowRun?.currentNodeId).toBe('load');

    state = await executeNode(state);
    expect(state.workflowRun?.nodes.find((row) => row.nodeId === 'load')?.status).toBe(
      'succeeded',
    );
    expect(state.workflowNodeOutputs?.['obs:load_page_context:load']).toBeDefined();
    expect(routeAfterExecuteNode(state)).toBe('workflow_advance');

    state = await advanceNode(state);
    expect(state.workflowRun?.currentNodeId).toBe('answer');
    expect(state.taskPlan?.completedStepIds).toContain('load');
    expect(state.taskPlan?.currentStepId).toBe('answer');
    expect(routeAfterWorkflowAdvance(state)).toBe('execute_node');
  });

  it('plan_compile produces routable workflowRun (init → execute_node)', () => {
    const state = seedWorkflowGraphState();
    state.workflowRun = null;
    state.workflowNodeDefs = undefined;

    const compiled = compileTaskPlanToWorkflow({
      plan: state.taskPlan!,
      workflowId: 0,
      version: 1,
    });
    expect(compiled?.workflowRun.currentNodeId).toBe('load');
    expect(compiled?.nodes.map((row) => row.action)).toEqual([
      'fetch_data',
      'summarize',
    ]);

    const routed = routeAfterWorkflowInit({
      ...state,
      workflowRun: compiled!.workflowRun,
      workflowNodeDefs: compiled!.nodes,
    });
    expect(routed).toBe('execute_node');
  });

  it('summarize action routes to summarize node before execution', () => {
    const state = seedWorkflowGraphState();
    const withAnswerCurrent = {
      ...state,
      workflowRun: {
        ...state.workflowRun!,
        currentNodeId: 'answer',
        nodes: state.workflowRun!.nodes.map((row) =>
          row.nodeId === 'load'
            ? { ...row, status: 'succeeded' as const }
            : row.nodeId === 'answer'
              ? { ...row, status: 'running' as const }
              : row,
        ),
      },
    };

    expect(routeAfterExecuteNode(withAnswerCurrent)).toBe('summarize');
  });
});
