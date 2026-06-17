import type { AgentRunStep } from '../agent-engine/engine/main/agent-engine.types';
import type { AgentEngineTool } from '../agent-engine/engine/main/agent-engine.types';
import { isMutationTool } from '../agent-engine/engine/tool/tool-execution-status.util';
import type { HostActionSsePayload } from './host-action.types';
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

export function buildHostActionSyncPayload(input: {
  pageContext: AgentChatPageContext;
  runId: number;
  turnId: number;
  skillConfig?: unknown;
  reason?: string;
}): HostActionSsePayload {
  const skillHostBridge = parseSkillHostBridgeConfig(input.skillConfig);
  const entity = input.pageContext.entity
    ? ({ ...input.pageContext.entity } as Record<string, unknown>)
    : undefined;
  const metadata = resolveHostActionMetadata(input.pageContext);
  return {
    action: 'host_action',
    status: 'completed',
    scope: input.pageContext.page?.trim() || undefined,
    entity,
    ...(metadata ? { metadata } : {}),
    reason:
      input.reason ??
      skillHostBridge?.reason ??
      'agent_mutation_success',
    runId: input.runId,
    turnId: input.turnId,
  };
}
