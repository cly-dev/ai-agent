export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';

export type LlmChatMessage = {
  role: LlmRole;
  content: string;
  /** Required when role is `tool` for OpenAI-compatible APIs. */
  toolCallId?: string;
};

export type LlmToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type LlmToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

import type { LlmModelKind } from '../../../generated/prisma/client';
import type { PromptBudgetHints } from './prompt-budget/prompt-budget.types';

export type LlmChatInput = {
  messages: LlmChatMessage[];
  tools?: LlmToolDefinition[];
  parameters?: Record<string, unknown>;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  budgetHints?: PromptBudgetHints;
  /** Override input token budget (tokens). Defaults to model context minus output reserve. */
  messageTokenBudget?: number;
};

export type LlmChatRequest = LlmChatInput & {
  model: string;
};

export type LlmAdapterConfig = {
  baseUrl: string;
  chatPath: string;
  apiKey?: string | null;
};

export type LlmChatResult = {
  /** 用户可见正文（仅 content 通道；reasoning_content 不并入）。 */
  content: string;
  toolCalls: LlmToolCall[];
  model: string;
  raw: unknown;
  streamMeta?: {
    emittedDeltaCount: number;
    fellBackToInvoke: boolean;
    /** thinking 模型（如 qwen3.x-plus）流式期间收到的 reasoning-only chunk 数；排查思考泄露用。 */
    reasoningDeltaCount?: number;
  };
};

/**
 * content / reasoning 双通道协议：
 * - contentDelta：用户可见正文，进 fill / prose / summary；
 * - reasoningDelta：模型思考（reasoning_content 字段），只进 think SSE 或丢弃，
 *   永不并入正文。<think> 标签内联思考由 llm-stream-router 在 content 通道内处理。
 */
export type LlmStreamDelta = {
  model: string;
  contentDelta: string;
  reasoningDelta?: string;
  toolCalls: LlmToolCall[];
  done: boolean;
  raw: unknown;
};

export type LlmStreamHandlers = {
  onDelta?: (delta: LlmStreamDelta) => void;
  signal?: AbortSignal;
};

export type LlmConnectionTestResult = {
  ok: boolean;
  configId: number;
  kind: LlmModelKind;
  provider: string;
  model: string;
  probe: 'chat' | 'embedding_api' | 'embedding_local' | 'unsupported';
  durationMs: number;
  error?: string;
  detail?: Record<string, unknown>;
};
