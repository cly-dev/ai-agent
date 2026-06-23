import type { AgentGraphState } from './main/types/agent-engine.types';
import type { ToolObservation } from './main/types/agent-engine.types';
import {
  formatSplitObservationsPromptBlock,
  toolObservationsToPayloads,
} from './observation-format.util';

export type ToolObservationRow = { name: string; output: unknown };

export type SplitToolObservationsInput = {
  workingMemory: ToolObservation[];
  currentRun: ToolObservation[];
};

/** 图初始从 GOA / 写确认上下文预载的观测（本 run 之前已有）。 */
export function preloadedToolObservations(
  state: Pick<AgentGraphState, 'preloadedToolObservations'>,
): ToolObservation[] {
  return state.preloadedToolObservations ?? [];
}

/** 本 run 内新增的工具观测（不含预载）。 */
export function runOwnedToolObservations(
  state: Pick<AgentGraphState, 'toolObservations'>,
): ToolObservation[] {
  return state.toolObservations;
}

export function splitToolObservationsFromState(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
): SplitToolObservationsInput {
  return {
    workingMemory: preloadedToolObservations(state),
    currentRun: runOwnedToolObservations(state),
  };
}

/** Plan / resultCheck / runRound 等决策使用的完整观测序列。 */
export function allToolObservations(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
): ToolObservation[] {
  return [...preloadedToolObservations(state), ...runOwnedToolObservations(state)];
}

/** 决策 / summarize prompt：working memory 与 current run 分块序列化。 */
export function formatSplitObservationsFromState(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
): string {
  const split = splitToolObservationsFromState(state);
  return formatSplitObservationsPromptBlock({
    workingMemory: toolObservationsToPayloads(split.workingMemory, 'session'),
    currentRun: toolObservationsToPayloads(split.currentRun, 'current_run'),
  });
}

/** runRound 返回合并列表后，只把新增部分追加到 run-owned。 */
export function mergeRunRoundObservations(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
  mergedFromRound: ToolObservationRow[],
): ToolObservation[] {
  const baselineLen = allToolObservations(state).length;
  const added = mergedFromRound.slice(baselineLen);
  if (added.length === 0) {
    return state.toolObservations;
  }
  return [...state.toolObservations, ...added];
}
