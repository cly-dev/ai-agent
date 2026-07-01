import type { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { type AgentChatPageContext, type HostToolDecisionDefinition } from '../../../../../host-bridge';
import type { TurnRespondRequest } from '../../../turn/turn-respond.types';
import type { AgentGraphState, AgentLangGraphRunInput, AgentRunStep } from '../../types/agent-engine.types';
import type { AgentGraphDeps, AgentGraphRunContext } from '../types/graph.types';
import type { RequestedSkillRunContext } from '../../skill/requested-skill-run.service';
export interface AgentGraphRunHelpers {
    updateRun: (runId: number, steps: AgentRunStep[], status: AgentRunStatus) => Promise<void>;
    normalizeJsonLike: (value: unknown) => Record<string, unknown> | string | undefined;
    graphFinalOutputFromArtifact: (sessionId: string, runId: number, continuePlan: boolean, previousFinalOutput: string) => string;
    resolveAssistantOutputFromArtifact: (sessionId: string, runId: number, fallbackSerialized: string) => {
        serialized: string;
        stepPlain: string;
    };
    publishMutationGateBlockedDraft: (sessionId: string, runId: number, turnId: number, message: string) => void;
    loadScopedHostTools: (input: AgentLangGraphRunInput, pageContext: AgentChatPageContext | null | undefined, skillId: number | null | undefined) => Promise<{
        scopedHostTools: HostToolDecisionDefinition[];
        scopedHostLangChainTools: DynamicStructuredTool[];
    }>;
    sanitizeFinalOutput: (value: string) => string;
    tryParseJsonObject: (value: string) => Record<string, unknown> | null;
    resolveFallbackReply: (config: unknown) => string | null;
    buildTurnRespondState: (state: AgentGraphState, steps: AgentRunStep[], request: TurnRespondRequest) => AgentGraphState;
    isIntentMatched: (state: AgentGraphState) => boolean;
}
export declare function createBuildTurnRespondState(): (state: AgentGraphState, steps: AgentRunStep[], request: TurnRespondRequest) => AgentGraphState;
export declare function createIsIntentMatched(_requestedSkillCtx: RequestedSkillRunContext | null): (state: AgentGraphState) => boolean;
export declare function bindRunContextHelpers(helpers: AgentGraphRunHelpers, ctx: AgentGraphRunContext): AgentGraphRunHelpers;
export declare function updateRun(deps: AgentGraphDeps, runId: number, steps: AgentRunStep[], status: AgentRunStatus): Promise<void>;
export declare function normalizeJsonLike(value: unknown): Record<string, unknown> | string | undefined;
export declare function tryParseJsonObject(value: string): Record<string, unknown> | null;
export declare function graphFinalOutputFromArtifact(deps: AgentGraphDeps, sessionId: string, runId: number, continuePlan: boolean, previousFinalOutput: string): string;
export declare function resolveAssistantOutputFromArtifact(deps: AgentGraphDeps, sessionId: string, runId: number, fallbackSerialized: string): {
    serialized: string;
    stepPlain: string;
};
export declare function publishMutationGateBlockedDraft(deps: AgentGraphDeps, sessionId: string, runId: number, turnId: number, message: string): void;
export declare function sanitizeFinalOutput(value: string): string;
export declare function loadScopedHostTools(deps: AgentGraphDeps, input: AgentLangGraphRunInput, pageContext: AgentChatPageContext | null | undefined, skillId: number | null | undefined): Promise<{
    scopedHostTools: HostToolDecisionDefinition[];
    scopedHostLangChainTools: DynamicStructuredTool[];
}>;
export declare function resolveFallbackReply(config: unknown): string | null;
export declare function createAgentGraphRunHelpers(deps: AgentGraphDeps): AgentGraphRunHelpers;
