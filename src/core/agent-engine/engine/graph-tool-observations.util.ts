import type { AgentGraphState } from './main/agent-engine.types';

export type ToolObservationRow = { name: string; output: unknown };

/** 图初始从 GOA / 写确认上下文预载的观测（本 run 之前已有）。 */
export function preloadedToolObservations(
  state: Pick<AgentGraphState, 'preloadedToolObservations'>,
): ToolObservationRow[] {
  return state.preloadedToolObservations ?? [];
}

/** 本 run 内新增的工具观测（不含预载）。 */
export function runOwnedToolObservations(
  state: Pick<AgentGraphState, 'toolObservations'>,
): ToolObservationRow[] {
  return state.toolObservations;
}

/** Plan / resultCheck / runRound 等决策使用的完整观测序列。 */
export function allToolObservations(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
): ToolObservationRow[] {
  return [...preloadedToolObservations(state), ...runOwnedToolObservations(state)];
}

/** runRound 返回合并列表后，只把新增部分追加到 run-owned。 */
export function mergeRunRoundObservations(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
  mergedFromRound: ToolObservationRow[],
): ToolObservationRow[] {
  const baselineLen = allToolObservations(state).length;
  const added = mergedFromRound.slice(baselineLen);
  if (added.length === 0) {
    return state.toolObservations;
  }
  return [...state.toolObservations, ...added];
}
