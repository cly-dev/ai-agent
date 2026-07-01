import { createExecuteNodeNode } from '../agent-engine/engine/main/agent-graph/nodes/execute-node.node';
import { createWorkflowReactNode } from '../agent-engine/engine/main/agent-graph/nodes/workflow-react.node';
import {
  routeAfterExecuteNode,
} from './workflow-graph-routing.util';
import {
  fetchSummarizeWorkflowNodes,
  mockFetchToolObservation,
  mockReadDetailTool,
  seedFetchSummarizeWorkflowState,
} from './workflow-graph-fixture.util';
import { ensureWorkflowNodeStarted } from './workflow-plan-sync.util';
import { createIntegrationTestBundle } from '../agent-engine/engine/main/agent-graph/test-fixture/agent-graph.integration-fixture';

describe('workflow_react integration (node chain)', () => {
  it('execute_node delegates fetch_data to workflow_react', async () => {
    const bundle = createIntegrationTestBundle();
    const executeNode = createExecuteNodeNode(bundle);
    let state = seedFetchSummarizeWorkflowState();
    state = {
      ...state,
      workflowRun: ensureWorkflowNodeStarted(state.workflowRun!, 'fetch'),
      scopedTools: [mockReadDetailTool()],
      toolObservations: [mockFetchToolObservation()],
    };

    state = await executeNode(state);
    expect(state.workflowAwaitingReact).toBe(true);
    expect(routeAfterExecuteNode(state)).toBe('workflow_react');
  });

  it('workflow_react exits toward summarize when fetch step is observation-satisfied', async () => {
    const bundle = createIntegrationTestBundle();
    const reactNode = createWorkflowReactNode(bundle);

    let state = seedFetchSummarizeWorkflowState();
    state = {
      ...state,
      workflowRun: ensureWorkflowNodeStarted(state.workflowRun!, 'fetch'),
      workflowNodeDefs: fetchSummarizeWorkflowNodes,
      workflowAwaitingReact: true,
      scopedTools: [mockReadDetailTool()],
      toolObservations: [mockFetchToolObservation()],
      skillApplied: true,
      activeSkillId: 1,
    };

    state = await reactNode(state);
    expect(state.pendingRespond).not.toBeNull();
    expect(state.steps.some((row) => row.type === 'readiness')).toBe(true);
    const fetchNode = state.workflowRun?.nodes.find(
      (row) => row.nodeId === 'fetch',
    );
    expect(fetchNode?.status).toBe('succeeded');
  });
});
