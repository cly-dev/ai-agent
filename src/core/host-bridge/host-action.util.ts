import { isMutationTool } from '../tool-engine/tool-mutation.util';
import type {
  HostActionHostToolInvocation,
  HostActionSsePayload,
} from './host-action.types';
import { HOST_TOOL_STREAM_PROTOCOL_VERSION } from './host-tool-stream.types';
import type { HostMutationRunStep, HostMutationScopedTool } from './host-mutation-step.types';
import {
  parseSkillHostBridgeConfig,
  resolveHostActionMetadata,
  type SkillHostBridgeConfig,
} from './host-action.resolve.util';
import type { AgentChatPageContext } from './page-context.types';
import { resolveHostToolPageScope } from './page-context-anchor.util';

export type { SkillHostBridgeConfig };

export function hasSuccessfulMutationStep(
  steps: HostMutationRunStep[],
  scopedTools: HostMutationScopedTool[],
): boolean {
  const toolByName = new Map(scopedTools.map((tool) => [tool.name, tool]));
  for (const step of steps) {
    if (step.type !== 'tool' || !step.name) {
      continue;
    }
    const def = toolByName.get(step.name);
    if (!def || !isMutationTool(def.agentMetadata)) {
      continue;
    }
    if (step.meta?.executionStatus === 'SUCCESS') {
      return true;
    }
  }
  return false;
}

/** 构建 mode=full 快照（run step 元数据）；live dispatch 请用 dispatchHostActionInstant。 */
export function buildHostActionPayload(input: {
  pageContext?: AgentChatPageContext | null;
  runId: number;
  turnId: number;
  hostTools: HostActionHostToolInvocation[];
  skillConfig?: unknown;
  planStepId?: string | null;
  reason?: string;
}): HostActionSsePayload {
  const skillHostBridge = parseSkillHostBridgeConfig(input.skillConfig);
  const pageContext = input.pageContext ?? {};
  const entity = pageContext.entity
    ? ({ ...pageContext.entity } as Record<string, unknown>)
    : undefined;
  const metadata = resolveHostActionMetadata(pageContext);
  const scope = resolveHostToolPageScope(pageContext);
  return {
    action: 'host_action',
    v: HOST_TOOL_STREAM_PROTOCOL_VERSION,
    stream: { mode: 'full', seq: 1 },
    scope: scope ?? undefined,
    entity,
    ...(metadata ? { metadata } : {}),
    hostTools: input.hostTools,
    ...(input.planStepId
      ? {
          hostStepId: input.planStepId,
          planStepId: input.planStepId,
        }
      : {}),
    reason:
      input.reason ??
      skillHostBridge?.reason ??
      'host_tool_dispatch',
    runId: input.runId,
    turnId: input.turnId,
  };
}

/** @deprecated 使用 buildHostActionPayload */
export function buildHostActionSyncPayload(
  input: Parameters<typeof buildHostActionPayload>[0],
): HostActionSsePayload {
  return buildHostActionPayload({
    ...input,
    reason: input.reason ?? 'agent_mutation_success',
  });
}
