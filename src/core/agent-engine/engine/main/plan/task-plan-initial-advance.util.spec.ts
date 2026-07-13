import {
  planSummarizeHasToolEvidence,
  planSummarizeRequiresToolEvidence,
} from './plan-summarize-gate.util';
import { resolveTaskPlanInitialAdvance } from './task-plan.util';
import type { TaskPlanSnapshot } from './task-plan.types';

function analysisTemplatePlan(): TaskPlanSnapshot {
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

describe('resolveTaskPlanInitialAdvance summarize gate alignment', () => {
  const scopedTools = [
    {
      name: 'listReviews',
      description: 'list',
      agentMetadata: null,
      responseProfile: { decisionRole: 'read-list' },
    },
  ];

  it('does not skip to summarize on fresh when run-owned obs do not match gather evidence', () => {
    const plan = analysisTemplatePlan();
    expect(planSummarizeRequiresToolEvidence(plan)).toBe(true);
    const advance = resolveTaskPlanInitialAdvance({
      plan,
      allObservations: [{ name: 'staleTool', output: { records: [{ id: 1 }] } }],
      runOwnedObservations: [{ name: 'staleTool', output: { records: [{ id: 1 }] } }],
      observationBuckets: {
        preloaded: [],
        runOwned: [{ name: 'staleTool', output: { records: [{ id: 1 }] } }],
      },
      scopedTools,
      userMessage: 'analyze',
      planRunContext: 'fresh',
      buildMergedObservation: () => null,
    });
    expect(advance).toBeNull();
  });

  it('allows resume initial summarize when strict gather evidence exists in buckets', () => {
    const plan = analysisTemplatePlan();
    const obs = {
      name: 'listReviews',
      output: { records: [{ id: 1 }], total: 1 },
    };
    const advance = resolveTaskPlanInitialAdvance({
      plan,
      allObservations: [obs],
      runOwnedObservations: [],
      observationBuckets: { preloaded: [obs], runOwned: [] },
      scopedTools,
      userMessage: 'continue analyze',
      planRunContext: 'resume',
      buildMergedObservation: () => obs,
    });
    expect(advance?.reason).toBe('plan_initial_summarize');
    expect(
      planSummarizeHasToolEvidence({
        plan,
        observationBuckets: { preloaded: [obs], runOwned: [] },
        scopedTools,
      }),
    ).toBe(true);
  });
});
