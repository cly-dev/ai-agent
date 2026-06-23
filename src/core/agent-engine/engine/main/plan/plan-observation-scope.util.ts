import {
  preloadedToolObservations,
  runOwnedToolObservations,
} from '../../graph-tool-observations.util';
import type { AgentGraphState, ToolObservation } from '../types/agent-engine.types';

/**
 * 本 turn 运行上下文：telemetry、plan 首步 summarize 是否可凭 GOA 放行。
 * 与 pre_tools 选桶无关（gather 跳步恒只看 runOwned）。
 */
export type PlanRunContext = 'fresh' | 'resume';

/** 图内两桶观测（不含运行上下文）。 */
export type PlanObservationBuckets = {
  preloaded: ToolObservation[];
  runOwned: ToolObservation[];
};

/** pre_tools 跳步 / readiness / plan_sync：仅本 run 工具观测。 */
export function selectObservationsForPlanToolSatisfaction(
  buckets: PlanObservationBuckets,
): ToolObservation[] {
  return buckets.runOwned;
}

/** 分页 gather 续拉：会话内未完成列表可落在 GOA 预载，需合并两桶。 */
export function selectObservationsForPagedGatherResume(
  buckets: PlanObservationBuckets,
): ToolObservation[] {
  return [...buckets.preloaded, ...buckets.runOwned];
}

export function planObservationBucketsFromState(
  state: Pick<
    AgentGraphState,
    'preloadedToolObservations' | 'toolObservations'
  >,
): PlanObservationBuckets {
  return {
    preloaded: preloadedToolObservations(state),
    runOwned: runOwnedToolObservations(state),
  };
}

export function planRunContextFromState(
  state: Pick<AgentGraphState, 'planRunContext'>,
): PlanRunContext {
  return state.planRunContext ?? 'fresh';
}

export function resolveInitialPlanRunContext(input: {
  resumeFromWriteConfirm?: boolean;
  graphInitialState?: Pick<AgentGraphState, 'planRunContext' | 'taskPlan'> | null;
}): PlanRunContext {
  if (input.resumeFromWriteConfirm) {
    return 'resume';
  }
  if (input.graphInitialState?.planRunContext === 'resume') {
    return 'resume';
  }
  return 'fresh';
}
