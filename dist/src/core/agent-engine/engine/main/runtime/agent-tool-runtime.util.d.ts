import { ToolEngineService, type BuiltLangChainTools, type ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import type { ToolExecutionResult } from '../../../../tool-engine/tool-engine.types';
import type { ToolResponseProfile } from '../../../../tool-engine/tool-response-profile.types';
import { type AgentMachineCode } from '../../agent-run-user-messages.util';
import type { ToolRoundMeta } from '../../tool/tool-result-check.util';
import { type RunMetricsAccumulator } from '../../run-metrics.util';
import type { AgentEngineTool, AgentRunStep, GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import type { AgentService } from '../../../../../modules/agent/agent.service';
import type { PrismaService } from '../../../../../prisma/prisma.service';
import { type ToolErrorDisposition, type ToolExecutionStatus } from '../../tool/tool-execution-status.util';
export type ToolExecutionResultWithMeta = ToolExecutionResult & {
    attempts: number;
    executionStatus: ToolExecutionStatus;
    errorDisposition?: ToolErrorDisposition;
};
export declare function buildEngineToolsFromAllowed(allowedTools: Awaited<ReturnType<AgentService['getAllowedTools']>>, userId: number, toolEngine: ToolEngineService): {
    tools: AgentEngineTool[];
    toolProfilesByName: Record<string, ToolResponseProfile | null>;
    allowedToolIds: number[];
    langChainTools: BuiltLangChainTools;
    toolBuildCtx: ToolBuildContext;
};
export declare function buildEngineToolsFromAllowedWithCredentials(allowedTools: Awaited<ReturnType<AgentService['getAllowedTools']>>, userId: number, toolEngine: ToolEngineService, prisma: PrismaService): Promise<ReturnType<typeof buildEngineToolsFromAllowed>>;
export declare function invokeToolWithRetry(toolEngine: ToolEngineService, bundle: BuiltLangChainTools, scopedTools: AgentEngineTool[], toolCall: GraphToolCall): Promise<ToolExecutionResultWithMeta>;
export type ExecuteToolCallsRoundInput = {
    latestUserMessage: string;
    toolCalls: GraphToolCall[];
    scopedTools: AgentEngineTool[];
    toolProfilesByName: Record<string, ToolResponseProfile | null>;
    langChainBundle: BuiltLangChainTools;
    toolEngine: ToolEngineService;
    observations: ToolObservation[];
    steps: AgentRunStep[];
    iteration: number;
    assessObservationQuality: (output: unknown, agentMetadata?: unknown) => 'high' | 'medium' | 'low';
    resolveToolStepCode?: (quality: 'high' | 'medium' | 'low', output: unknown, agentMetadata?: unknown) => AgentMachineCode | null;
    runMetrics?: RunMetricsAccumulator;
    runId?: number;
    sessionId?: string;
    onThink?: (message: string) => void;
    onToolDebugLog?: (message: string) => void;
    assertContinue?: () => void;
};
export type ExecuteToolCallsRoundResult = {
    steps: AgentRunStep[];
    toolObservations: ToolObservation[];
    lastToolRoundMeta: ToolRoundMeta;
};
export declare function executeToolCallsRound(input: ExecuteToolCallsRoundInput): Promise<ExecuteToolCallsRoundResult>;
export declare function executePendingWriteToolCalls(input: {
    latestUserMessage: string;
    toolCalls: Array<{
        name: string;
        arguments: Record<string, unknown>;
    }>;
    tools: AgentEngineTool[];
    langChainBundle: BuiltLangChainTools;
    priorSteps?: AgentRunStep[];
    priorObservations?: ToolObservation[];
    toolEngine: ToolEngineService;
    assessObservationQuality: (output: unknown, agentMetadata?: unknown) => 'high' | 'medium' | 'low';
    runId?: number;
    sessionId?: string;
    onToolDebugLog?: (message: string) => void;
    assertContinue?: () => void;
}): Promise<{
    observations: ToolObservation[];
    steps: AgentRunStep[];
    lastToolRoundMeta: ToolRoundMeta;
}>;
