import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import { isMutationTool } from '../agent-engine/engine/tool/tool-execution-status.util';
import type {
  HostActionHostToolInvocation,
  HostActionSsePayload,
} from './host-action.types';
import type { AgentChatPageContext } from './page-context.types';
import {
  parseSkillHostBridgeConfig,
  resolveHostActionMetadata,
  type SkillHostBridgeConfig,
} from './host-action.resolve.util';

export type { SkillHostBridgeConfig };

export function hasSuccessfulMutationStep(
  steps: AgentRunStep[],
  scopedTools: AgentEngineTool[],
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

/** 推送 hostTools 给前端 registry 执行（Plan LLM 产参或 mutation 后模板解析）。 */
export function buildHostActionPayload(input: {
  pageContext: AgentChatPageContext;
  runId: number;
  turnId: number;
  hostTools: HostActionHostToolInvocation[];
  skillConfig?: unknown;
  planStepId?: string | null;
  reason?: string;
}): HostActionSsePayload {
  const skillHostBridge = parseSkillHostBridgeConfig(input.skillConfig);
  const entity = input.pageContext.entity
    ? ({ ...input.pageContext.entity } as Record<string, unknown>)
    : undefined;
  const metadata = resolveHostActionMetadata(input.pageContext);
  return {
    action: 'host_action',
    scope: input.pageContext.page?.trim() || undefined,
    entity,
    ...(metadata ? { metadata } : {}),
    hostTools: input.hostTools,
    ...(input.planStepId ? { planStepId: input.planStepId } : {}),
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
