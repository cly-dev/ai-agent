import { initWorkflowRun } from './workflow-run.util';
import { tryBuildSessionResumeWorkflowSlice } from './session-resume-workflow.util';
import { routeAfterSummarizeWorkflowAxis, routeAfterWorkflowInit } from './workflow-graph-routing.util';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';

describe('session-resume-workflow.util', () => {
  it('builds resume slice when plan steps cover saved workflow nodes', () => {
    const workflowRun = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: [
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
      ],
      compiledFrom: 'workflow_db',
    });
    workflowRun.nodes[0]!.status = 'succeeded';
    workflowRun.currentNodeId = 'answer';

    const slice = tryBuildSessionResumeWorkflowSlice({
      workflowRun,
      taskPlan: {
        source: 'workflow',
        originalUserRequest: 'go',
        goal: 'go',
        deliverable: 'answer',
        constraints: [],
        steps: [
          {
            id: 'fetch',
            kind: 'tool',
            objective: 'Fetch',
            phase: 'gather',
            toolRole: 'read-detail',
          },
          {
            id: 'answer',
            kind: 'summarize',
            objective: 'Answer',
            phase: 'answer',
          },
        ],
        pendingStepIds: ['answer'],
        completedStepIds: ['fetch'],
        taskPhase: 'answer',
        currentObjective: 'Answer',
        currentStepId: 'answer',
        frames: [],
        activeFrameIndex: 0,
      },
    });

    expect(slice?.workflowRun.currentNodeId).toBe('answer');
    expect(slice?.workflowNodeDefs.map((row) => row.id)).toEqual([
      'fetch',
      'answer',
    ]);
  });
});

describe('workflow-graph-routing summarize axis', () => {
  it('routes to summarize when workflow init produced no run', () => {
    expect(
      routeAfterWorkflowInit({
        finished: false,
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
      } as AgentGraphState),
    ).toBe('summarize');
  });

  it('ends summarize when no active workflow run remains', () => {
    expect(
      routeAfterSummarizeWorkflowAxis(
        {
          finished: false,
          pendingToolCalls: [],
        } as AgentGraphState,
        false,
      ),
    ).toBe('__end__');
  });
});
