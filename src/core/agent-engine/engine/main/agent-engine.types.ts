import type { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { AgentRunStatus, ToolLevel } from '../../../../../generated/prisma/client';
import type { ToolExecutionDefinition } from '../../../tool-engine/tool-engine.service';
import type { BuiltLangChainTools } from '../../../tool-engine/tool-engine.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import type { LlmObservationPayload } from '../observation-format.util';
import type { AgentMachineCode } from '../agent-run-user-messages.util';
import type { ToolResponseProfile } from '../../../tool-engine/tool-response-profile.types';
import type { RunMetricsAccumulator } from '../run-metrics.util';
import type { ToolBuildContext } from '../../../tool-engine/tool-engine.service';

export type AgentRunInput = {
  userId: number;
  sessionId: string;
  input: string;
  userMessageId: number;
};

export type ResumeAfterWriteConfirmInput = {
  userId: number;
  sessionId: string;
  userMessageId?: number;
};

export type AgentRunStepType =
  | 'precheck'
  | 'skill'
  | 'intent'
  | 'llm'
  | 'tool'
  | 'summarize';

export type PrecheckReasonCode =
  | 'HISTORY_SUFFICIENT'
  | 'HISTORY_INSUFFICIENT'
  | 'PRECHECK_PARSE_FAILED'
  | 'PRECHECK_LLM_FAILED';

export const precheckDecisionSchema = z.object({
  answerableFromObservation: z.boolean(),
  reason: z.string().optional().nullable(),
});

export type AgentRunStep = {
  step: number;
  type: AgentRunStepType;
  name?: string;
  input?: Record<string, unknown> | string;
  output?: Record<string, unknown> | string;
  meta?: {
    prompt?: string;
    agentPrompt?: string;
    userRequest?: string;
    model?: string;
    latency?: number;
    quality?: 'high' | 'medium' | 'low';
    code?: AgentMachineCode | PrecheckReasonCode;
  };
};

/** 运行期 scoped 工具：含 HTTP 执行字段与 responseProfile，全程存于 graph state。 */
export type AgentEngineTool = ToolExecutionDefinition & {
  toolCategoryId: number | null;
  riskLevel: ToolLevel;
  responseProfile: unknown;
  agentMetadata: unknown;
};

export type ParsedIntentPayload = {
  intentClear: boolean;
  guidance: string;
  matchedCategoryIds: number[];
  includeUncategorized: boolean;
};

export type AgentRunResult = {
  runId: number;
  turnId: number;
  output: string;
  status: AgentRunStatus;
};

export type ScopedToolsResult = {
  scopedTools: AgentEngineTool[];
  scopedLangChainTools: DynamicStructuredTool[];
  scopedToolBundle: BuiltLangChainTools;
  scopedAllowedToolIds: number[];
  bindCap?: Record<string, unknown>;
  fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
};

export type CachedScopedToolsEntry = ScopedToolsResult & {
  toolFingerprint: string;
  expiresAt: number;
};

export const SESSION_TOOL_CACHE_TTL_MS = 10 * 60 * 1000;
export const MAX_SESSION_TOOL_CACHE_ENTRIES = 256;

export type GraphToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolObservation = {
  name: string;
  output: unknown;
  llmPayload?: LlmObservationPayload;
  quality?: 'high' | 'medium' | 'low';
  fieldLabels?: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
};

export type AgentGraphState = {
  iteration: number;
  steps: AgentRunStep[];
  toolObservations: ToolObservation[];
  pendingToolCalls: GraphToolCall[];
  pendingSummaryObservation: ToolObservation | null;
  intentKind: 'task' | 'smalltalk' | 'unclear';
  finalOutput: string;
  status: AgentRunStatus;
  finished: boolean;
  scopedTools: AgentEngineTool[];
  scopedLangChainTools: DynamicStructuredTool[];
  scopedAllowedToolIds: number[];
  scopedToolBundle: BuiltLangChainTools | null;
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  hasExpandedOnce: boolean;
  awaitingWriteConfirmation?: boolean;
  /** skill 节点命中后为 true，跳过 intent / llm 内 bind 收窄。 */
  skillApplied?: boolean;
  activeSkillId?: number | null;
  activeSkillPrompt?: string | null;
};

export type AgentLangGraphRunInput = {
  promptMessages: LlmChatMessage[];
  latestUserMessage: string;
  sessionId: string;
  runId: number;
  userId: number;
  appClientId: number;
  agentId: number;
  maxSteps: number;
  enableToolCall: boolean;
  tools: AgentEngineTool[];
  langChainTools: BuiltLangChainTools;
  toolBuildCtx: ToolBuildContext;
  allowedToolIds: number[];
  messageTokenBudget: number;
  runMetrics: RunMetricsAccumulator;
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  turnId: number;
  resumeFromLlm?: boolean;
  graphInitialState?: Partial<AgentGraphState>;
  approvedWriteToolNames?: string[];
};
