import { assessGatherToolCandidateReadiness } from './plan-gather-candidate-readiness.util';
import type { TaskPlanSnapshot } from './task-plan.types';

function analysisGatherPlan(): TaskPlanSnapshot {
  return {
    source: 'template',
    goal: 'Analyze reviews',
    originalUserRequest: 'Analyze reviews',
    deliverable: 'analysis',
    constraints: [],
    steps: [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-list',
        objective: 'Fetch',
        stopWhen: 'observation_fetch_complete',
      },
      {
        id: 'analyze',
        phase: 'analyze',
        kind: 'summarize',
        objective: 'Analyze',
        stopWhen: 'always',
      },
    ],
    frames: [],
    pendingStepIds: ['fetch', 'analyze'],
    completedStepIds: [],
    currentStepId: 'fetch',
    currentObjective: 'Fetch',
    taskPhase: 'gather',
    activeFrameIndex: 0,
  };
}

describe('plan-gather-candidate-readiness.util', () => {
  it('blocks broad analysis when only high-friction list tools remain', () => {
    const readiness = assessGatherToolCandidateReadiness({
      taskPlan: analysisGatherPlan(),
      candidates: [
        {
          name: 'listReviews',
          description: 'list',
          agentMetadata: null,
          responseProfile: { decisionRole: 'read-list' },
        },
      ],
      strategy: 'role_match_all',
    });
    expect(readiness).toEqual({
      status: 'blocked',
      reason: 'broad_analysis_requires_low_friction_list_tool',
    });
  });

  it('allows broad analysis when a zero-required list tool exists', () => {
    const readiness = assessGatherToolCandidateReadiness({
      taskPlan: analysisGatherPlan(),
      candidates: [
        {
          name: 'searchReviews',
          description: 'search',
          agentMetadata: { operation: 'LIST' },
          responseProfile: { decisionRole: 'read-list' },
          inputSchema: {
            type: 'object',
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
            },
          },
        },
      ],
      strategy: 'broad_list_preferred',
    });
    expect(readiness).toEqual({ status: 'ready' });
  });
});
