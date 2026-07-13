import type { TurnRouteDraft } from './turn-routing.types';

const ROUTE_GUARD_SUFFIX = ' [route_guard:task_not_direct_answer]';

/**
 * 非 smalltalk 任务意图不得走 direct_answer（分析/拉数必须进 orchestrated 管线）。
 * smalltalk 在 turn_route 节点已短路，此处只处理 task / unclear。
 * 例外：页内已有足够 inline 数据、仅需 answer 时保留 direct_answer。
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
  return {
    ...input.routeDraft,
    route: 'orchestrated_task',
    reason: input.routeDraft.reason.includes(ROUTE_GUARD_SUFFIX)
      ? input.routeDraft.reason
      : `${input.routeDraft.reason}${ROUTE_GUARD_SUFFIX}`,
  };
}
