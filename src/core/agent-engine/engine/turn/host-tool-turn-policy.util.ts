import type { PageContextPlanKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnExecutionRoute } from '../../../host-bridge/page-context-execution-policy.util';

export type HostToolTurnPolicy = {
  allowHostToolSteps: boolean;
  allowHostToolAutoDispatch: boolean;
  allowHostToolLlmDispatch: boolean;
};

const disabled: HostToolTurnPolicy = {
  allowHostToolSteps: false,
  allowHostToolAutoDispatch: false,
  allowHostToolLlmDispatch: false,
};

const enabled: HostToolTurnPolicy = {
  allowHostToolSteps: true,
  allowHostToolAutoDispatch: true,
  allowHostToolLlmDispatch: true,
};

/**
 * L0：是否启用 host_tool 工作流。
 * 仅 host 写通道启用；http 写与读 plan 均禁用 host_tool。
 */
export function resolveHostToolTurnPolicy(input: {
  route: TurnExecutionRoute;
  pageContextPlan: PageContextPlanKind;
  writeChannel: 'none' | 'http' | 'host';
}): HostToolTurnPolicy {
  if (input.route === 'direct_answer') {
    return disabled;
  }
  if (input.writeChannel === 'host') {
    return enabled;
  }
  if (input.pageContextPlan !== 'none') {
    return disabled;
  }
  return disabled;
}
