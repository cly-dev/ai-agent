import type { TurnRouteDraft } from './turn-routing.types';

const ROUTE_GUARD_SUFFIX = ' [route_guard:task_not_direct_answer]';

/**
 * 是否存在「direct_answer 不可靠、必须进编排」的契约信号。
 * 无信号时尊重 Route LLM 的 direct_answer（如常识/问时间），避免 task 默认意图误升 orchestrated。
 */
function hasOrchestrationOverrideSignal(draft: TurnRouteDraft): boolean {
  if (draft.draftWriteChannel !== 'none') {
    return true;
  }
  if (draft.suggestedSkillId != null) {
    return true;
  }
  if (
    draft.pageContextApplies &&
    (draft.llmPageContextTaskKind === 'analyze' ||
      draft.llmPageContextTaskKind === 'mutation')
  ) {
    return true;
  }
  return false;
}

/**
 * 对 Route LLM 的 direct_answer 做最小纠偏（非「非 smalltalk 一律升级」）。
 *
 * - smalltalk：原样放行（turn_route 已短路，此处兜底）
 * - 默认：信任 direct_answer（常识问答、问时间等）
 * - 仅当草稿带编排强信号时升级到 orchestrated_task：
 *   writeChannel≠none / suggestedSkillId / pageContext analyze|mutation
 * - 页内 inline answer：保留 direct_answer
 */
export function guardTaskRouteDraftForIntent(input: {
  intentKind: 'task' | 'smalltalk' | 'unclear';
  routeDraft: TurnRouteDraft;
}): TurnRouteDraft {
  if (input.intentKind === 'smalltalk') {
    return input.routeDraft;
  }
  if (input.routeDraft.route !== 'direct_answer') {
    return input.routeDraft;
  }
  if (
    input.routeDraft.pageContextApplies &&
    input.routeDraft.llmPageContextTaskKind === 'answer'
  ) {
    return input.routeDraft;
  }
  // 无编排信号：保留 LLM 的 direct_answer，避免「现在几点」被当成 fetch 任务。
  if (!hasOrchestrationOverrideSignal(input.routeDraft)) {
    return input.routeDraft;
  }
  return {
    ...input.routeDraft,
    route: 'orchestrated_task',
    reason: input.routeDraft.reason.includes(ROUTE_GUARD_SUFFIX)
      ? input.routeDraft.reason
      : `${input.routeDraft.reason}${ROUTE_GUARD_SUFFIX}`,
  };
}
