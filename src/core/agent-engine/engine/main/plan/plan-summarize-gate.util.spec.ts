import {
  assessPlanSummarizeGate,
  planSummarizeRequiresToolEvidence,
  resolvePlanGatherRewindWhenToolsMissing,
  rewindPlanToGatherStep,
} from './plan-summarize-gate.util';
import type { TaskPlanSnapshot } from './task-plan.types';

function analysisTemplatePlan(): TaskPlanSnapshot {
  return {
    source: 'template',
    goal: 'Analyze reviews 2022-2023',
    originalUserRequest: 'Analyze reviews 2022-2023',
    deliverable: 'analysis',
    constraints: [],
    steps: [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-list',
        objective: 'Fetch reviews',
        stopWhen: 'observation_fetch_complete',
      },
      {
        id: 'analyze',
        phase: 'analyze',
        kind: 'summarize',
        objective: 'Analyze observations',
        stopWhen: 'always',
      },
    ],
    frames: [],
    pendingStepIds: ['analyze'],
    completedStepIds: ['fetch'],
    currentStepId: 'analyze',
    currentObjective: 'Analyze observations',
    taskPhase: 'analyze',
    activeFrameIndex: 0,
  };
}

describe('plan-summarize-gate.util', () => {
  it('requires tool evidence for analysis template plans', () => {
    expect(planSummarizeRequiresToolEvidence(analysisTemplatePlan())).toBe(true);
  });

  it('rewinds to gather when analyze step has no observations', () => {
    const gate = assessPlanSummarizeGate({
      plan: analysisTemplatePlan(),
      observationBuckets: { preloaded: [], runOwned: [] },
      scopedTools: [
        {
          name: 'listReviews',
          description: 'list',
          agentMetadata: null,
          responseProfile: { decisionRole: 'read-list' },
        },
      ],
    });
    expect(gate.status).toBe('rewind_gather');
    if (gate.status === 'rewind_gather') {
      expect(gate.gatherStepId).toBe('fetch');
      expect(gate.rewindPlan.pendingStepIds[0]).toBe('fetch');
      expect(gate.rewindPlan.pendingStepIds).toContain('analyze');
    }
  });

  it('allows summarize when strict gather evidence exists', () => {
    const gate = assessPlanSummarizeGate({
      plan: analysisTemplatePlan(),
      observationBuckets: {
        preloaded: [],
        runOwned: [
          {
            name: 'listReviews',
            output: { records: [{ id: 1 }], total: 1 },
          },
        ],
      },
      scopedTools: [
        {
          name: 'listReviews',
          description: 'list',
          agentMetadata: null,
          responseProfile: { decisionRole: 'read-list' },
        },
      ],
    });
    expect(gate).toEqual({
      status: 'allowed',
      reason: 'gather_evidence_present',
    });
  });

  it('rewindPlanToGatherStep resets pending queue from gather step', () => {
    const rewound = rewindPlanToGatherStep(analysisTemplatePlan(), 'fetch');
    expect(rewound.pendingStepIds).toEqual(['fetch', 'analyze']);
    expect(rewound.completedStepIds).toEqual([]);
    expect(rewound.currentStepId).toBe('fetch');
  });

  it('resolvePlanGatherRewindWhenToolsMissing works on gather phase without answer step', () => {
    const plan = {
      ...analysisTemplatePlan(),
      pendingStepIds: ['fetch', 'analyze'],
      completedStepIds: [],
      currentStepId: 'fetch',
      currentObjective: 'Fetch reviews',
      taskPhase: 'gather' as const,
    };
    const rewind = resolvePlanGatherRewindWhenToolsMissing({
      plan,
      observationBuckets: { preloaded: [], runOwned: [] },
      scopedTools: [
        {
          name: 'listReviews',
          description: 'list',
          agentMetadata: null,
          responseProfile: { decisionRole: 'read-list' },
        },
      ],
    });
    expect(rewind?.status).toBe('rewind_gather');
    expect(rewind?.gatherStepId).toBe('fetch');
  });
});
