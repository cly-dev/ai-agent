import { resolveSummarizeMemoryScope } from './summarize-memory-scope.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';

function chitchatPlan(): TaskPlanSnapshot {
  return {
    source: 'minimal',
    goal: '今天天气怎么样',
    originalUserRequest: '今天天气怎么样',
    deliverable: 'answer',
    constraints: ['chitchat'],
    steps: [
      {
        id: 'chitchat_reply',
        phase: 'answer',
        kind: 'reason',
        objective: 'Reply naturally',
        stopWhen: 'always',
      },
    ],
    frames: [],
    pendingStepIds: ['chitchat_reply'],
    completedStepIds: [],
    currentStepId: 'chitchat_reply',
    currentObjective: 'Reply naturally',
    taskPhase: 'answer',
    activeFrameIndex: 0,
  };
}

describe('summarize-memory-scope.util', () => {
  it('does not use working_memory for chitchat direct_answer plans', () => {
    const scope = resolveSummarizeMemoryScope({
      split: {
        workingMemory: [
          {
            name: 'listRecords',
            output: { records: [{ id: 1 }] },
          },
        ],
        currentRun: [],
      },
      plan: chitchatPlan(),
    });
    expect(scope.primarySource).toBe('none');
    expect(scope.reason).toBe('chitchat_no_tool_memory');
    expect(scope.workingMemory).toEqual([]);
    expect(scope.currentRun).toEqual([]);
  });

  it('still uses follow_up_working_memory for resume orchestrated analyze reason step', () => {
    const scope = resolveSummarizeMemoryScope({
      split: {
        workingMemory: [
          {
            name: 'listRecords',
            output: { records: [{ id: 1 }] },
          },
        ],
        currentRun: [],
      },
      planRunContext: 'resume',
      plan: {
        ...chitchatPlan(),
        constraints: [],
        deliverable: 'analysis',
        steps: [
          {
            id: 'analyze',
            phase: 'analyze',
            kind: 'summarize',
            objective: 'Analyze observations',
            stopWhen: 'always',
          },
        ],
        pendingStepIds: ['analyze'],
        currentStepId: 'analyze',
      },
    });
    expect(scope.primarySource).toBe('working_memory');
    expect(scope.reason).toBe('follow_up_working_memory');
  });

  it('blocks working_memory for fresh_same_goal replan on gather plans', () => {
    const gatherPlan = {
      ...chitchatPlan(),
      constraints: [],
      deliverable: 'analysis' as const,
      steps: [
        {
          id: 'fetch',
          phase: 'gather' as const,
          kind: 'tool' as const,
          toolRole: 'read-list' as const,
          objective: 'Fetch',
          stopWhen: 'observation_fetch_complete' as const,
        },
        {
          id: 'analyze',
          phase: 'analyze' as const,
          kind: 'summarize' as const,
          objective: 'Analyze observations',
          stopWhen: 'always' as const,
        },
      ],
    };
    const scopedTools = [
      {
        name: 'listRecords',
        description: 'list',
        agentMetadata: null,
        responseProfile: { decisionRole: 'read-list' as const },
      },
    ];
    const workingMemory = [
      {
        name: 'listRecords',
        output: { records: [{ id: 1 }] },
      },
    ];
    const split = {
      workingMemory,
      currentRun: [],
    };

    const analyzeScope = resolveSummarizeMemoryScope({
      split,
      planRunContext: 'fresh_same_goal',
      scopedTools,
      plan: {
        ...gatherPlan,
        pendingStepIds: ['analyze'],
        currentStepId: 'analyze',
      },
    });
    expect(analyzeScope.primarySource).toBe('none');
    expect(analyzeScope.reason).toBe('replan_requires_fresh_gather');
    expect(analyzeScope.workingMemory).toEqual([]);

    const gatherScope = resolveSummarizeMemoryScope({
      split,
      planRunContext: 'fresh_same_goal',
      scopedTools,
      plan: {
        ...gatherPlan,
        pendingStepIds: ['fetch', 'analyze'],
        currentStepId: 'fetch',
        currentObjective: 'Fetch',
        taskPhase: 'gather',
      },
    });
    expect(gatherScope.primarySource).toBe('none');
    expect(gatherScope.reason).toBe('replan_requires_fresh_gather');
    expect(gatherScope.workingMemory).toEqual([]);
  });
});
