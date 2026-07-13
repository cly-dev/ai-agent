import { resolveOrchestratedReadPlanResult } from './resolve-orchestrated-read-plan.util';
import type { PlanTurnAxes } from './plan-turn-context.util';

const readListScopedTools = [
  {
    name: 'listRecords',
    role: 'read-list' as const,
  },
];

describe('resolve-orchestrated-read-plan.util', () => {
  it('uses template plan without outer LLM and applies inherited goal axes', () => {
    const planAxes: PlanTurnAxes = {
      turnMessage: 'continue',
      goal: 'Analyze feedback sentiment',
      originalUserRequest: 'Analyze feedback sentiment',
      inheritedFromActiveTask: true,
      goalStrategy: 'inherit_active_task',
    };
    const result = resolveOrchestratedReadPlanResult({
      planInput: {
        userMessage: 'continue',
        scopedToolSummaries: readListScopedTools,
        availableSkills: [],
      },
      deliverable: 'analysis',
      planAxes,
    });
    expect(result.method).toBe('template');
    expect(result.plan.goal).toBe('Analyze feedback sentiment');
    expect(result.plan.steps.map((step) => step.id)).toEqual([
      'fetch',
      'analyze',
    ]);
    expect(result.plan.steps[0]?.kind).toBe('tool');
    expect(result.plan.steps[0]?.toolRole).toBe('read-list');
  });

  it('falls back to rule plan when template cannot be built', () => {
    const planAxes: PlanTurnAxes = {
      turnMessage: 'show details',
      goal: 'show details',
      originalUserRequest: 'show details',
      inheritedFromActiveTask: false,
      goalStrategy: 'use_turn_message',
    };
    const result = resolveOrchestratedReadPlanResult({
      planInput: {
        userMessage: 'show details',
        scopedToolSummaries: [],
        availableSkills: [],
      },
      deliverable: 'list',
      planAxes,
    });
    expect(result.llmFallbackReason).toBe('orchestrated_read_rule_fallback');
    expect(result.plan.source).toBe('minimal');
  });
});
