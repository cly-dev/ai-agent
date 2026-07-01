import { resolveResultCheckPlanFallback } from './result-check-route.util';

describe('resolveResultCheckPlanFallback', () => {
  it('mirrors workflow on plan_advance_tool_step when post_tools continues to llm', () => {
    const fallback = resolveResultCheckPlanFallback({
      outcome: {
        phase: 'post_tools',
        route: 'llm',
        reason: 'continue_decision_loop',
        pendingToolCalls: [],
        duplicateSkipCalls: [],
      },
      planAdvance: {
        updatedPlan: {} as never,
        route: 'llm',
        reason: 'plan_advance_tool_step',
      },
    });
    expect(fallback).toEqual({
      action: 'llm_continue',
      authority: 'plan',
      clearPendingToolCalls: false,
      reason: 'plan_advance_tool_step',
    });
  });
});
