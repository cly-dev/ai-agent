import type { HostToolDecisionDefinition } from './host-tool-decision.types';
import { resolveHostToolDeliveryContract } from './host-tool-delivery-contract.util';
import { isHostToolStreamEnabled } from './host-tool-stream-env.util';

export const HOST_TOOL_STREAM_REASON = 'plan_host_tool_stream' as const;

export type HostToolStreamToolTarget = {
  name: string;
  streamablePath: string;
};

/** DSL stream 锚点：始终为即将 dispatch 的 host_tool plan step。 */
export type HostToolStreamTarget = {
  hostStepId: string;
  reasonStepId: string | null;
  streamId: string;
  tools: HostToolStreamToolTarget[];
  reason: typeof HOST_TOOL_STREAM_REASON;
};

export type PlanReasonHostStreamDelivery =
  | { mode: 'stream'; target: HostToolStreamTarget }
  | { mode: 'observation' };

export function primaryHostToolStreamTool(
  target: HostToolStreamTarget,
): HostToolStreamToolTarget {
  return target.tools[0]!;
}

/** 与交付契约一致：仅 fill_stream 返回可 append 路径。 */
export function resolveStreamablePathFromHostTool(
  tool: HostToolDecisionDefinition,
): string | null {
  return resolveHostToolDeliveryContract(tool).streamablePath;
}

/**
 * 为 plan_host_fill / fill_stream 解析可 arg.append 的工具。
 * 结构化 instant 工具不在此列（由 tool-call 或 PageAction instant 路径交付）。
 */
export function resolvePlanReasonHostFillTools(input: {
  hostTools: HostToolDecisionDefinition[];
  allowedToolNames: Set<string>;
}): HostToolStreamToolTarget[] {
  const tools: HostToolStreamToolTarget[] = [];
  for (const tool of input.hostTools) {
    if (!input.allowedToolNames.has(tool.name)) {
      continue;
    }
    const path = resolveStreamablePathFromHostTool(tool);
    if (!path) {
      continue;
    }
    tools.push({ name: tool.name, streamablePath: path });
  }
  return tools;
}

export function buildHostToolStreamId(input: {
  runId: number;
  turnId: number;
  stepId: string;
}): string {
  return `hs-${input.runId}-${input.turnId}-${input.stepId}`;
}

export function buildPlanReasonHostStreamTarget(input: {
  hostStepId: string;
  reasonStepId: string | null;
  runId: number;
  turnId: number;
  tools: HostToolStreamToolTarget[];
}): HostToolStreamTarget {
  const hostStepId = input.hostStepId.trim();
  return {
    hostStepId,
    reasonStepId: input.reasonStepId,
    streamId: buildHostToolStreamId({
      runId: input.runId,
      turnId: input.turnId,
      stepId: hostStepId,
    }),
    tools: input.tools,
    reason: HOST_TOOL_STREAM_REASON,
  };
}

/**
 * reason 机器层交付：有 host step 且可 publish 则 DSL fill_stream，否则仅 plan_host_fill。
 */
export function resolvePlanReasonHostStreamDelivery(input: {
  hostStepId: string | null;
  fillTools: HostToolStreamToolTarget[];
  runId: number;
  turnId: number;
  reasonStepId: string | null;
  canPublishRun: boolean;
}): PlanReasonHostStreamDelivery {
  const hostStepId = input.hostStepId?.trim() ?? '';
  if (
    !hostStepId ||
    input.fillTools.length === 0 ||
    !input.canPublishRun ||
    !isHostToolStreamEnabled()
  ) {
    return { mode: 'observation' };
  }

  return {
    mode: 'stream',
    target: buildPlanReasonHostStreamTarget({
      hostStepId,
      reasonStepId: input.reasonStepId,
      runId: input.runId,
      turnId: input.turnId,
      tools: input.fillTools,
    }),
  };
}
