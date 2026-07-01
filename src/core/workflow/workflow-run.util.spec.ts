import {
  advanceWorkflowRun,
  allWorkflowNodesTerminal,
  completeWorkflowNode,
  failWorkflowNode,
  finalizeWorkflowRun,
  initWorkflowRun,
  skipWorkflowNode,
  startWorkflowNode,
} from './workflow-run.util';
import type { WorkflowNodeDef } from './workflow.types';

const linearNodes: WorkflowNodeDef[] = [
  {
    id: 'load',
    action: 'load_page_context',
    name: 'Load',
    objective: 'Load page',
    input: {},
  },
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch',
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

const NOW = '2026-06-24T08:00:00.000Z';
const LATER = '2026-06-24T08:01:00.000Z';

describe('workflow-run.util', () => {
  it('initWorkflowRun seeds pending nodes and first currentNodeId', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 3,
      nodes: linearNodes,
      compiledFrom: 'workflow_db',
    });

    expect(run.status).toBe('running');
    expect(run.currentNodeId).toBe('load');
    expect(run.compiledFrom).toBe('workflow_db');
    expect(run.nodes.map((node) => node.status)).toEqual([
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('runs linear success path: start → complete → advance → finalize', () => {
    let run = initWorkflowRun({
      workflowId: 0,
      version: 1,
      nodes: linearNodes,
      compiledFrom: 'plan_llm',
    });

    run = startWorkflowNode(run, 'load', NOW);
    expect(getNode(run, 'load')?.status).toBe('running');

    run = completeWorkflowNode(run, 'load', 'obs:load:0', LATER);
    run = advanceWorkflowRun(run);
    expect(run.currentNodeId).toBe('fetch');

    run = startWorkflowNode(run, 'fetch', LATER);
    run = completeWorkflowNode(run, 'fetch', 'obs:fetch:0', LATER);
    run = advanceWorkflowRun(run);
    expect(run.currentNodeId).toBe('summarize');

    run = startWorkflowNode(run, 'summarize', LATER);
    run = completeWorkflowNode(run, 'summarize', undefined, LATER);
    run = advanceWorkflowRun(run);
    expect(run.currentNodeId).toBeNull();

    run = finalizeWorkflowRun(run, 'completed');
    expect(run.status).toBe('completed');
    expect(allWorkflowNodesTerminal(run)).toBe(true);
    expect(getNode(run, 'load')?.outputRef).toBe('obs:load:0');
  });

  it('failWorkflowNode marks run failed and blocks advance', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: linearNodes,
    });
    run = startWorkflowNode(run, 'fetch', NOW);
    run = failWorkflowNode(run, 'fetch', {
      code: 'TOOL_EMPTY',
      message: 'empty observation',
    });

    expect(run.status).toBe('failed');
    expect(getNode(run, 'fetch')?.error?.code).toBe('TOOL_EMPTY');
    expect(advanceWorkflowRun(run)).toEqual(run);
  });

  it('skipWorkflowNode allows advance to next pending node', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: linearNodes,
    });
    run = startWorkflowNode(run, 'load', NOW);
    run = skipWorkflowNode(run, 'load', LATER);
    run = advanceWorkflowRun(run);

    expect(getNode(run, 'load')?.status).toBe('skipped');
    expect(run.currentNodeId).toBe('fetch');
  });

  it('throws when advancing before current node is terminal', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: linearNodes,
    });
    run = startWorkflowNode(run, 'load', NOW);
    expect(() => advanceWorkflowRun(run)).toThrow(/cannot advance/);
  });
});

function getNode(run: ReturnType<typeof initWorkflowRun>, nodeId: string) {
  return run.nodes.find((node) => node.nodeId === nodeId);
}
