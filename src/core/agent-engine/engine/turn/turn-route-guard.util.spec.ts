import { guardTaskRouteDraftForIntent } from './turn-route-guard.util';
import type { TurnRouteDraft } from './turn-routing.types';
import { DEFAULT_TURN_READ_DELIVERABLE } from './turn-routing.types';

function directAnswerDraft(): TurnRouteDraft {
  return {
    route: 'direct_answer',
    method: 'llm',
    reason: 'llm_direct',
    suggestedSkillId: null,
    pageContextApplies: false,
    llmPageContextTaskKind: 'none',
    readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    draftWriteChannel: 'none',
  };
}

describe('turn-route-guard.util', () => {
  it('keeps direct_answer for smalltalk intent', () => {
    const draft = directAnswerDraft();
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'smalltalk', routeDraft: draft }),
    ).toEqual(draft);
  });

  it('upgrades task intent direct_answer to orchestrated_task', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'task',
      routeDraft: directAnswerDraft(),
    });
    expect(guarded.route).toBe('orchestrated_task');
    expect(guarded.reason).toContain('route_guard:task_not_direct_answer');
  });

  it('upgrades unclear intent direct_answer to orchestrated_task', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'unclear',
      routeDraft: directAnswerDraft(),
    });
    expect(guarded.route).toBe('orchestrated_task');
  });

  it('keeps direct_answer when page context can answer inline', () => {
    const draft: TurnRouteDraft = {
      ...directAnswerDraft(),
      pageContextApplies: true,
      llmPageContextTaskKind: 'answer',
    };
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'task', routeDraft: draft }),
    ).toEqual(draft);
  });

  it('still upgrades page context analyze direct_answer to orchestrated_task', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'task',
      routeDraft: {
        ...directAnswerDraft(),
        pageContextApplies: true,
        llmPageContextTaskKind: 'analyze',
      },
    });
    expect(guarded.route).toBe('orchestrated_task');
  });
});
