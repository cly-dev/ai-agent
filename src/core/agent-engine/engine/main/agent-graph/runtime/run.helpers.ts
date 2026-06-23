import type { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentRunStatus, type Prisma } from '../../../../../../../generated/prisma/client';
import {
  buildHostLangChainTools,
  type AgentChatPageContext,
  type HostToolDecisionDefinition,
} from '../../../../../host-bridge';
import { logHostToolResolve } from '../../../../../host-bridge/host-tool-resolve-debug.util';
import { maxRunStepNumber } from '../../run/agent-run-steps.util';
import { textBlock, sanitizeStoredFinalOutput } from '../../../message/message-blocks.util';
import { allToolObservations } from '../../../graph-tool-observations.util';
import { pendingRespondFromTurn } from '../../../turn/turn-respond.util';
import type { TurnRespondRequest } from '../../../turn/turn-respond.types';
import type {
  AgentGraphState,
  AgentLangGraphRunInput,
  AgentRunStep,
} from '../../types/agent-engine.types';
import type { AgentGraphDeps, AgentGraphRunContext } from '../types/graph.types';
import type { RequestedSkillRunContext } from '../../skill/requested-skill-run.service';

export interface AgentGraphRunHelpers {
  updateRun: (
    runId: number,
    steps: AgentRunStep[],
    status: AgentRunStatus,
  ) => Promise<void>;
  normalizeJsonLike: (
    value: unknown,
  ) => Record<string, unknown> | string | undefined;
  graphFinalOutputFromArtifact: (
    sessionId: string,
    runId: number,
    continuePlan: boolean,
    previousFinalOutput: string,
  ) => string;
  resolveAssistantOutputFromArtifact: (
    sessionId: string,
    runId: number,
    fallbackSerialized: string,
  ) => { serialized: string; stepPlain: string };
  publishMutationGateBlockedDraft: (
    sessionId: string,
    runId: number,
    turnId: number,
    message: string,
  ) => void;
  loadScopedHostTools: (
    input: AgentLangGraphRunInput,
    pageContext: AgentChatPageContext | null | undefined,
    skillId: number | null | undefined,
  ) => Promise<{
    scopedHostTools: HostToolDecisionDefinition[];
    scopedHostLangChainTools: DynamicStructuredTool[];
  }>;
  sanitizeFinalOutput: (value: string) => string;
  tryParseJsonObject: (value: string) => Record<string, unknown> | null;
  resolveFallbackReply: (config: unknown) => string | null;
  buildTurnRespondState: (
    state: AgentGraphState,
    steps: AgentRunStep[],
    request: TurnRespondRequest,
  ) => AgentGraphState;
  isIntentMatched: (state: AgentGraphState) => boolean;
}

export function createBuildTurnRespondState() {
  return (
    state: AgentGraphState,
    steps: AgentRunStep[],
    request: TurnRespondRequest,
  ): AgentGraphState => ({
    ...state,
    steps,
    pendingRespond: pendingRespondFromTurn(request),
    scopedTools: [],
    scopedLangChainTools: [],
    scopedToolBundle: null,
    scopedAllowedToolIds: [],
  });
}

export function createIsIntentMatched(
  requestedSkillCtx: RequestedSkillRunContext | null,
) {
  return (state: AgentGraphState): boolean => {
    if (requestedSkillCtx) {
      return true;
    }
    if (allToolObservations(state).length > 0) {
      return true;
    }
    for (let i = state.steps.length - 1; i >= 0; i -= 1) {
      const step = state.steps[i];
      if (step.type !== 'intent') {
        continue;
      }
      const output = step.output;
      if (output == null || typeof output !== 'object' || Array.isArray(output)) {
        continue;
      }
      const row = output as Record<string, unknown>;
      if (row.intentClear === false) {
        continue;
      }
      const matched = row.matchedCategoryIds;
      if (Array.isArray(matched) && matched.length > 0) {
        return true;
      }
    }
    return false;
  };
}

export function bindRunContextHelpers(
  helpers: AgentGraphRunHelpers,
  ctx: AgentGraphRunContext,
): AgentGraphRunHelpers {
  return {
    ...helpers,
    isIntentMatched: createIsIntentMatched(ctx.requestedSkillCtx),
  };
}

export async function updateRun(
  deps: AgentGraphDeps,
  runId: number,
  steps: AgentRunStep[],
  status: AgentRunStatus,
): Promise<void> {
  await deps.prisma.agentRun.update({
    where: { id: runId },
    data: {
      steps: steps as unknown as Prisma.InputJsonValue,
      currentStep: maxRunStepNumber(steps),
      status,
    },
  });
}

export function normalizeJsonLike(
  value: unknown,
): Record<string, unknown> | string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return String(value);
}

export function tryParseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function graphFinalOutputFromArtifact(
  deps: AgentGraphDeps,
  sessionId: string,
  runId: number,
  continuePlan: boolean,
  previousFinalOutput: string,
): string {
  if (continuePlan) {
    return previousFinalOutput;
  }
  return (
    deps.assistantArtifact.peekSerialized(sessionId, runId) ??
    previousFinalOutput
  );
}

export function resolveAssistantOutputFromArtifact(
  deps: AgentGraphDeps,
  sessionId: string,
  runId: number,
  fallbackSerialized: string,
): { serialized: string; stepPlain: string } {
  return deps.assistantArtifact.formatOutput(
    sessionId,
    runId,
    fallbackSerialized,
  );
}

export function publishMutationGateBlockedDraft(
  deps: AgentGraphDeps,
  sessionId: string,
  runId: number,
  turnId: number,
  message: string,
): void {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }
  const artifactTurnId =
    deps.assistantArtifact.peekTurnId(sessionId, runId) ?? turnId;
  const blocks = deps.sse.publishAssistantBlocks(
    sessionId,
    runId,
    [textBlock(trimmed, 'markdown')],
    { turnId: artifactTurnId, phase: 'draft' },
  );
  if (blocks.length === 0) {
    deps.assistantArtifact.commit(
      sessionId,
      runId,
      [textBlock(trimmed, 'markdown')],
      'draft',
    );
  }
}

export function sanitizeFinalOutput(value: string): string {
  return sanitizeStoredFinalOutput(value);
}

export async function loadScopedHostTools(
  deps: AgentGraphDeps,
  input: AgentLangGraphRunInput,
  pageContext: AgentChatPageContext | null | undefined,
  skillId: number | null | undefined,
): Promise<{
  scopedHostTools: HostToolDecisionDefinition[];
  scopedHostLangChainTools: DynamicStructuredTool[];
}> {
  if (!pageContext?.page?.trim()) {
    logHostToolResolve('loadScopedHostTools', {
      runId: input.runId,
      sessionId: input.sessionId,
      agentId: input.agentId,
      skillId: skillId ?? null,
      result: 'empty_page',
      pageContext,
      toolCount: 0,
    });
    return { scopedHostTools: [], scopedHostLangChainTools: [] };
  }
  const pageScope = pageContext.page.trim();
  const cached = deps.runScopeCache.getHostToolsForRun(
    input.runId,
    pageScope,
    skillId,
  );
  if (cached) {
    logHostToolResolve('loadScopedHostTools', {
      runId: input.runId,
      sessionId: input.sessionId,
      agentId: input.agentId,
      skillId: skillId ?? null,
      pageScope,
      cacheLayer: 'L0_run_scope',
      cacheHit: true,
      toolCount: cached.length,
      toolNames: cached.map((tool) => tool.name),
    });
    return {
      scopedHostTools: cached,
      scopedHostLangChainTools: buildHostLangChainTools(cached).tools,
    };
  }
  const scopedHostTools =
    await deps.hostToolService.resolveLlmHostToolsForDecision({
      appClientId: input.appClientId,
      agentId: input.agentId,
      skillId: skillId ?? null,
      pageContext,
      runId: input.runId,
      sessionId: input.sessionId,
    });
  deps.runScopeCache.setHostToolsForRun(
    input.runId,
    pageScope,
    skillId,
    scopedHostTools,
  );
  logHostToolResolve('loadScopedHostTools', {
    runId: input.runId,
    sessionId: input.sessionId,
    agentId: input.agentId,
    skillId: skillId ?? null,
    pageScope,
    cacheLayer: 'L0_run_scope',
    cacheHit: false,
    toolCount: scopedHostTools.length,
    toolNames: scopedHostTools.map((tool) => tool.name),
  });
  return {
    scopedHostTools,
    scopedHostLangChainTools: buildHostLangChainTools(scopedHostTools).tools,
  };
}

export function resolveFallbackReply(config: unknown): string | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return null;
  }
  const row = config as Record<string, unknown>;
  const fallback = row.fallbackReply;
  if (typeof fallback !== 'string') {
    return null;
  }
  return fallback.trim().length > 0 ? fallback.trim() : null;
}

export function createAgentGraphRunHelpers(deps: AgentGraphDeps): AgentGraphRunHelpers {
  return {
    updateRun: (runId, steps, status) => updateRun(deps, runId, steps, status),
    normalizeJsonLike,
    graphFinalOutputFromArtifact: (sessionId, runId, continuePlan, previousFinalOutput) =>
      graphFinalOutputFromArtifact(
        deps,
        sessionId,
        runId,
        continuePlan,
        previousFinalOutput,
      ),
    resolveAssistantOutputFromArtifact: (sessionId, runId, fallbackSerialized) =>
      resolveAssistantOutputFromArtifact(deps, sessionId, runId, fallbackSerialized),
    publishMutationGateBlockedDraft: (sessionId, runId, turnId, message) =>
      publishMutationGateBlockedDraft(deps, sessionId, runId, turnId, message),
    loadScopedHostTools: (input, pageContext, skillId) =>
      loadScopedHostTools(deps, input, pageContext, skillId),
    sanitizeFinalOutput,
    tryParseJsonObject,
    resolveFallbackReply,
    buildTurnRespondState: createBuildTurnRespondState(),
    isIntentMatched: createIsIntentMatched(null),
  };
}
