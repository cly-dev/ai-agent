import {
  preloadedToolObservations,
  runOwnedToolObservations,
} from '../../graph-tool-observations.util';
import { isPageContextSourcedObservation } from '../../../../host-bridge/page-context-usage.util';
import type { AgentGraphState, ToolObservation } from '../types/agent-engine.types';

/**
 * 本 turn 运行上下文：telemetry、plan 首步 summarize 是否可凭 GOA 放行。
 */
export type PlanRunContext = 'fresh' | 'resume';

/** 图内两桶观测（不含运行上下文）。 */
export type PlanObservationBuckets = {
  preloaded: ToolObservation[];
  runOwned: ToolObservation[];
};

/** pre_tools 跳步 / readiness / plan_sync：本 run 工具观测 + 页内物化 observation。 */
export function selectObservationsForPlanToolSatisfaction(
  buckets: PlanObservationBuckets,
): ToolObservation[] {
  const pagePreloaded = buckets.preloaded.filter((row) =>
    isPageContextSourcedObservation(row),
  );
  return [...pagePreloaded, ...buckets.runOwned];
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
