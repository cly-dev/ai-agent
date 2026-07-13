import {
  goalStrategyFromResumeDecision,
  resumeDecisionKeepsActiveTask,
} from './session-resume-decision.types';
import {
  fallbackTaskResumeFollowUpDecision,
  parseTaskResumeFollowUpDecision,
} from './session-resume-followup.util';

describe('session-resume-followup.util', () => {
  it('parses modern decision schema', () => {
    expect(
      parseTaskResumeFollowUpDecision({
        decision: 'replan_same_goal',
        reason: 'new angle',
      }),
    ).toEqual({
      decision: 'replan_same_goal',
      reason: 'new angle',
    });
  });

  it('maps legacy continueActiveTask to decision', () => {
    expect(
      parseTaskResumeFollowUpDecision({
        continueActiveTask: false,
        reason: 'switch',
      }),
    ).toEqual({
      decision: 'new_topic',
      reason: 'switch',
    });
  });

  it('falls back to resume when pending steps exist', () => {
    expect(
      fallbackTaskResumeFollowUpDecision({
        hasPendingOrRunningSteps: true,
      }),
    ).toEqual({
      decision: 'resume',
      reason: 'llm_failed_fallback',
    });
  });
});

describe('session-resume-decision.types', () => {
  it('maps resume decisions to goal strategy', () => {
    expect(
      goalStrategyFromResumeDecision({
        action: 'fresh_same_goal',
        followUpReason: 'angle',
        goalStrategy: 'inherit_active_task',
      }),
    ).toBe('inherit_active_task');
    expect(
      goalStrategyFromResumeDecision({
        action: 'fresh',
        goalStrategy: 'use_turn_message',
      }),
    ).toBe('use_turn_message');
  });

  it('keeps active task for resume and fresh_same_goal', () => {
    expect(
      resumeDecisionKeepsActiveTask({
        action: 'fresh_same_goal',
        followUpReason: null,
        goalStrategy: 'inherit_active_task',
      }),
    ).toBe(true);
    expect(resumeDecisionKeepsActiveTask({ action: 'abandon_and_fresh' })).toBe(
      false,
    );
  });
});
