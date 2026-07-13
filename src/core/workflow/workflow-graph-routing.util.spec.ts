import { initWorkflowRun } from './workflow-run.util';
import {
  routeAfterExecuteNode,
  routeAfterSummarizeWorkflowAxis,
  routeAfterWorkflowAdvance,
  routeAfterWorkflowInit,
  routeAfterWorkflowReact,
  routeResultCheckWorkflowAxis,
} from './workflow-graph-routing.util';
import { hasWorkflowInitSkippedStep } from './workflow-init-skip.util';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowNodeDef } from './workflow.types';

function baseState(
  overrides: Partial<AgentGraphState> = {},
): AgentGraphState {
  return {
    iteration: 0,
    steps: [],
    toolObservations: [],
    pendingToolCalls: [],
    pendingRespond: null,
    intentKind: 'task',
    finalOutput: '',
    status: 'running' as const,
    finished: false,
    scopedTools: [],
    scopedLangChainTools: [],
    scopedAllowedToolIds: [],
    hasExpandedOnce: false,
    skillApplied: false,
    activeSkillId: null,
    activeSkillPrompt: null,
    activeSkillName: null,
    activeSkillDescription: null,
    activeSkillConfig: null,
    activeSkillRiskLevel: null,
    taskPlan: null,
    lastToolRoundMeta: null,
    pagedListHttpUsed: 0,
    preloadedToolObservations: [],
    pageContext: null,
    scopedHostTools: [],
    scopedHostLangChainTools: [],
    turnExecutionContract: null,
    workflowAwaitingReact: false,
    ...overrides,
  } as AgentGraphState;
}

const nodes: WorkflowNodeDef[] = [
  {
    id: 'fetch',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch',
    input: { toolId: 1 },
  },
  {
    id: 'answer',
    action: 'summarize',
    name: 'Answer',
    objective: 'Answer',
    input: {},
  },
];

describe('workflow-graph-routing regression', () => {
  it('routeAfterWorkflowInit goes execute_node when workflowRun has current node', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'workflow_db',
    });
    expect(
      routeAfterWorkflowInit(
        baseState({ workflowRun: run, workflowNodeDefs: nodes }),
      ),
    ).toBe('execute_node');
  });

  it('routeAfterWorkflowInit goes summarize when init skipped (replaces legacy readiness)', () => {
    const steps = [
      {
        step: 1,
        type: 'workflow',
        name: 'workflow_init_skipped',
        output: { event: 'workflow_init_skipped', reason: 'db_load_failed' },
      },
    ] as AgentGraphState['steps'];
    expect(
      routeAfterWorkflowInit(
        baseState({
          taskPlan: {
            source: 'template',
            originalUserRequest: 'q',
            goal: 'q',
            deliverable: 'answer',
            constraints: [],
            steps: [],
            pendingStepIds: ['a'],
            completedStepIds: [],
            taskPhase: 'gather',
            currentObjective: 'a',
            currentStepId: 'a',
            frames: [],
            activeFrameIndex: 0,
          },
          steps,
        }),
      ),
    ).toBe('summarize');
    expect(hasWorkflowInitSkippedStep(steps)).toBe(true);
  });

  it('routeAfterExecuteNode routes fetch_data to workflow_react', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    expect(
      routeAfterExecuteNode(
        baseState({
          workflowRun: run,
          workflowNodeDefs: nodes,
          workflowAwaitingReact: true,
        }),
      ),
    ).toBe('workflow_react');
  });

  it('routeAfterExecuteNode routes summarize action to summarize node', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    run = { ...run, currentNodeId: 'answer' };
    expect(
      routeAfterExecuteNode(
        baseState({
          workflowRun: run,
          workflowNodeDefs: nodes,
        }),
      ),
    ).toBe('summarize');
  });

  it('routeAfterWorkflowReact advances when node succeeded', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    run = {
      ...run,
      nodes: run.nodes.map((row) =>
        row.nodeId === 'fetch' ? { ...row, status: 'succeeded' as const } : row,
      ),
    };
    expect(
      routeAfterWorkflowReact(
        baseState({
          workflowRun: run,
          workflowNodeDefs: nodes,
          workflowAwaitingReact: false,
        }),
      ),
    ).toBe('workflow_advance');
  });

  it('routeAfterWorkflowAdvance continues execute_node when more steps remain', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    run = {
      ...run,
      currentNodeId: 'answer',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'fetch' ? { ...row, status: 'succeeded' as const } : row,
      ),
    };
    expect(
      routeAfterWorkflowAdvance(
        baseState({ workflowRun: run, workflowNodeDefs: nodes }),
      ),
    ).toBe('execute_node');
  });

  it('routeResultCheckWorkflowAxis advances when current node succeeded', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes,
      compiledFrom: 'plan_llm',
    });
    run = {
      ...run,
      nodes: run.nodes.map((row) =>
        row.nodeId === 'fetch' ? { ...row, status: 'succeeded' as const } : row,
      ),
    };
    expect(
      routeResultCheckWorkflowAxis(
        baseState({ workflowRun: run, workflowNodeDefs: nodes }),
      ),
    ).toBe('workflow_advance');
  });

  it('routeAfterSummarizeWorkflowAxis ends when workflow complete', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: [nodes[1]!],
      compiledFrom: 'plan_llm',
    });
    expect(
      routeAfterSummarizeWorkflowAxis(
        baseState({
          workflowRun: { ...run, status: 'completed', currentNodeId: null },
        }),
        false,
      ),
    ).toBe('__end__');
  });

  it('routeAfterSummarizeWorkflowAxis routes to execute_node when next workflow node is pending', () => {
    const mutationNodes: WorkflowNodeDef[] = [
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
    ];
    let run = initWorkflowRun({
      workflowId: 2,
      version: 1,
      nodes: mutationNodes,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'await',
      nodes: run.nodes.map((row) => {
        if (row.nodeId === 'present') {
          return { ...row, status: 'succeeded' as const };
        }
        if (row.nodeId === 'await') {
          return { ...row, status: 'pending' as const };
        }
        return row;
      }),
    };
    expect(
      routeAfterSummarizeWorkflowAxis(
        baseState({ workflowRun: run, workflowNodeDefs: mutationNodes }),
        false,
      ),
    ).toBe('execute_node');
  });
});
