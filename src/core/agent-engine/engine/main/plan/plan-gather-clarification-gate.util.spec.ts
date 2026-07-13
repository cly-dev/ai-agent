import {
  isParamGateSourcedClarification,
  isPrematureGatherClarification,
} from './plan-gather-clarification-gate.util';
import type { TaskPlanSnapshot } from './task-plan.types';

function gatherAnalysisPlan(): TaskPlanSnapshot {
  return {
    source: 'template',
    goal: 'Analyze',
    originalUserRequest: 'Analyze',
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
    pendingStepIds: ['fetch'],
    completedStepIds: [],
    currentStepId: 'fetch',
    currentObjective: 'Fetch',
    taskPhase: 'gather',
    activeFrameIndex: 0,
  };
}

describe('plan-gather-clarification-gate.util', () => {
  it('allows param_gate sourced clarification', () => {
    expect(
      isParamGateSourcedClarification({
        readinessReason: 'param_gate:listReviews',
      }),
    ).toBe(true);
  });

  it('flags premature clarification without tools or param_gate', () => {
    expect(
      isPrematureGatherClarification({
        taskPlan: gatherAnalysisPlan(),
        observationBuckets: { preloaded: [], runOwned: [] },
        pendingRespond: {
          mode: 'turn',
          request: {
            kind: 'clarification',
            userMessage: 'need date',
            payload: { readinessReason: 'llm_inferred' },
          },
        },
      }),
    ).toBe(true);
  });

  it('does not flag param_gate clarification on gather step', () => {
    expect(
      isPrematureGatherClarification({
        taskPlan: gatherAnalysisPlan(),
        observationBuckets: { preloaded: [], runOwned: [] },
        pendingRespond: {
          mode: 'turn',
          request: {
            kind: 'clarification',
            userMessage: 'need sku',
            payload: {
              readinessReason: 'param_gate:listReviews',
              missingFields: [{ name: 'sku', hint: 'sku' }],
            },
          },
        },
      }),
    ).toBe(false);
  });
});
