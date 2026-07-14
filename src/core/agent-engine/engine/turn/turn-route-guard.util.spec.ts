import { guardTaskRouteDraftForIntent } from './turn-route-guard.util';
import type { TurnRouteDraft } from './turn-routing.types';
import { DEFAULT_TURN_READ_DELIVERABLE } from './turn-routing.types';

function directAnswerDraft(
  overrides: Partial<TurnRouteDraft> = {},
): TurnRouteDraft {
  return {
    route: 'direct_answer',
    method: 'llm',
    reason: 'llm_direct',
    suggestedSkillId: null,
    pageContextApplies: false,
    llmPageContextTaskKind: 'none',
    readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    draftWriteChannel: 'none',
    ...overrides,
  };
}

describe('turn-route-guard.util', () => {
  it('keeps direct_answer for smalltalk intent', () => {
    const draft = directAnswerDraft();
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'smalltalk', routeDraft: draft }),
    ).toEqual(draft);
  });

  it('keeps task intent direct_answer when no orchestration signals', () => {
    const draft = directAnswerDraft({
      reason: '询问当前时间，无需调用技能或工具',
    });
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'task', routeDraft: draft }),
    ).toEqual(draft);
  });

  it('keeps unclear intent direct_answer when no orchestration signals', () => {
    const draft = directAnswerDraft();
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'unclear', routeDraft: draft }),
    ).toEqual(draft);
  });

  it('keeps direct_answer when page context can answer inline', () => {
    const draft = directAnswerDraft({
      pageContextApplies: true,
      llmPageContextTaskKind: 'answer',
    });
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'task', routeDraft: draft }),
    ).toEqual(draft);
  });

  it('upgrades page context analyze direct_answer to orchestrated_task', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'task',
      routeDraft: directAnswerDraft({
        pageContextApplies: true,
        llmPageContextTaskKind: 'analyze',
      }),
    });
    expect(guarded.route).toBe('orchestrated_task');
    expect(guarded.reason).toContain('route_guard:task_not_direct_answer');
  });

  it('upgrades page context mutation direct_answer to orchestrated_task', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'task',
      routeDraft: directAnswerDraft({
        pageContextApplies: true,
        llmPageContextTaskKind: 'mutation',
      }),
    });
    expect(guarded.route).toBe('orchestrated_task');
  });

  it('upgrades when draftWriteChannel is not none', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'task',
      routeDraft: directAnswerDraft({ draftWriteChannel: 'http' }),
    });
    expect(guarded.route).toBe('orchestrated_task');
  });

  it('upgrades when suggestedSkillId is set', () => {
    const guarded = guardTaskRouteDraftForIntent({
      intentKind: 'task',
      routeDraft: directAnswerDraft({ suggestedSkillId: 12 }),
    });
    expect(guarded.route).toBe('orchestrated_task');
  });

  it('does not change non-direct_answer routes', () => {
    const draft = directAnswerDraft({
      route: 'orchestrated_task',
      reason: 'already_orchestrated',
    });
    expect(
      guardTaskRouteDraftForIntent({ intentKind: 'task', routeDraft: draft }),
    ).toEqual(draft);
  });
});
