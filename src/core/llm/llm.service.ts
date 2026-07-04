import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  LlmModelKind,
  type LlmModelConfig,
} from '../../../generated/prisma/client';
import { readEmbeddingRuntimeParameters } from './llm-embedding-parameters.util';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmModelConfigCacheStore } from './llm-model-config-cache.store';
import { normalizeToolCallArgs as normalizeToolArguments } from './tool-call-args.util';
import {
  estimateMessagesTokens,
} from './message-token-budget.util';
import { PromptBudgetService } from './prompt-budget/prompt-budget.service';
import type { FitMessagesResult, PromptBudgetHints } from './prompt-budget/prompt-budget.types';
import type {
  LlmChatInput,
  LlmChatMessage,
  LlmChatResult,
  LlmStreamHandlers,
  LlmToolCall,
  LlmToolDefinition,
} from './llm.types';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  /** 单次回复默认输出上限（与上下文窗口无关）。 */
  private static readonly DEFAULT_OUTPUT_MAX_TOKENS = 2048;
  /** 为 tool schema / 路由预留的 token 余量。 */
  private static readonly INVOCATION_TOKEN_BUFFER = 384;
  private static readonly LOCAL_EMBED_BATCH_SIZE = 16;
  private localEmbeddingRuntime:
    | {
        model: string;
        extractor: (
          input: string | string[],
          options?: Record<string, unknown>,
        ) => Promise<unknown>;
      }
    | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelConfigCache: LlmModelConfigCacheStore,
    private readonly promptBudgetService: PromptBudgetService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.refreshConfigCache();
    } catch (error) {
      this.logger.warn(
        `skip llm config preload on startup: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async refreshConfigCache(): Promise<void> {
    const chat = await this.loadActiveConfigFromDb(LlmModelKind.chat);
    await this.modelConfigCache.trySetActive(chat);

    const embedding = await this.loadActiveEmbeddingConfigFromDb();
    await this.modelConfigCache.deleteActive(
      LlmModelKind.transformers_embedding,
    );
    await this.modelConfigCache.deleteActive(LlmModelKind.api_embedding);
    if (embedding) {
      await this.modelConfigCache.trySetActive(embedding);
    }
    this.localEmbeddingRuntime = null;
  }

  async chat(input: LlmChatInput): Promise<LlmChatResult> {
    const messages = await this.applyPromptBudget(input);
    return this.invokeWithLangChain({ ...input, messages }, false);
  }

  async streamChat(
    input: LlmChatInput,
    handlers?: LlmStreamHandlers,
  ): Promise<LlmChatResult> {
    const messages = await this.applyPromptBudget(input);
    return this.invokeWithLangChain({ ...input, messages }, true, handlers);
  }

  /** 内部调用方读取当前启用的 chat 模型运行配置（含密钥），不要直接暴露给 HTTP 响应。 */
  async getActiveChatModelConfig(): Promise<LlmModelConfig> {
    return this.getCachedChatConfig();
  }

  /** 模型上下文窗口（parameters.contextLength 等），非输出 max_tokens。 */
  async getContextLength(): Promise<number | null> {
    const config = await this.getCachedConfig();
    return this.resolveContextLength(
      this.normalizeParameters(config.parameters),
    );
  }

  /** 配置的输出 max_tokens（已校正：不会误用整段 context 作为输出上限）。 */
  async getResolvedMaxTokens(): Promise<number> {
    const config = await this.getCachedConfig();
    const parameters = this.normalizeParameters(config.parameters);
    const contextLength = this.resolveContextLength(parameters);
    const raw =
      config.maxTokens ??
      this.pickNumber(parameters.maxTokens) ??
      LlmService.DEFAULT_OUTPUT_MAX_TOKENS;
    return this.normalizeConfiguredOutputMax(raw, contextLength);
  }

  /**
   * 按「上下文窗口 − 当前输入」计算本次请求可用的 max_tokens。
   */
  async resolveInvocationMaxTokens(
    messages: LlmChatMessage[],
  ): Promise<number> {
    const config = await this.getCachedConfig();
    const parameters = this.normalizeParameters(config.parameters);
    const contextLength = this.resolveContextLength(parameters);
    const configuredOutput = this.normalizeConfiguredOutputMax(
      config.maxTokens ??
        this.pickNumber(parameters.maxTokens) ??
        LlmService.DEFAULT_OUTPUT_MAX_TOKENS,
      contextLength,
    );
    const inputTokens = estimateMessagesTokens(messages);
    return this.capOutputMaxTokens(
      configuredOutput,
      contextLength,
      inputTokens,
    );
  }

  /**
   * Input message token budget derived from model config.
   * Uses optional contextLength (parameters) minus output reserve (maxTokens).
   * Falls back to maxTokens when contextLength is not configured.
   */
  async getMessageTokenBudget(): Promise<number> {
    const outputReserve = await this.getResolvedMaxTokens();
    const contextLength = await this.getContextLength();
    if (contextLength != null && contextLength > outputReserve) {
      return contextLength - outputReserve;
    }
    return outputReserve;
  }

  async trimMessagesToBudget(
    messages: LlmChatInput['messages'],
    hints?: PromptBudgetHints,
    budgetOverride?: number,
  ): Promise<LlmChatInput['messages']> {
    const result = await this.fitMessagesToBudget(
      messages,
      hints,
      budgetOverride,
    );
    return result.messages;
  }

  async fitMessagesToBudget(
    messages: LlmChatMessage[],
    hints?: PromptBudgetHints,
    budgetOverride?: number,
  ): Promise<FitMessagesResult> {
    const budget = budgetOverride ?? (await this.getMessageTokenBudget());
    return this.promptBudgetService.fitMessages(messages, budget, hints);
  }

  private async applyPromptBudget(input: LlmChatInput): Promise<LlmChatMessage[]> {
    const result = await this.fitMessagesToBudget(
      input.messages,
      input.budgetHints,
      input.messageTokenBudget,
    );
    return result.messages;
  }

  /** 是否已配置 embedding（DB transformers/api 或环境变量降级）。 */
  async isEmbeddingConfigured(): Promise<boolean> {
    const db = await this.getCachedEmbeddingConfig();
    if (db) {
      return true;
    }
    return (
      !!process.env.AGENT_EMBEDDING_MODEL?.trim() ||
      !!process.env.AGENT_EMBEDDING_LOCAL_MODEL?.trim()
    );
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const normalized = texts.map((text) => text.trim()).filter(Boolean);
    if (normalized.length === 0) {
      return [];
    }

    const dbEmbedding = await this.getCachedEmbeddingConfig();
    if (dbEmbedding?.kind === LlmModelKind.transformers_embedding) {
      const runtimeParams = readEmbeddingRuntimeParameters(dbEmbedding);
      return this.embedTextsByLocalTransformer(
        normalized,
        dbEmbedding.model,
        runtimeParams,
      );
    }
    if (dbEmbedding?.kind === LlmModelKind.api_embedding) {
      return this.embedTextsByRemoteApi(normalized, dbEmbedding);
    }

    const localModel = process.env.AGENT_EMBEDDING_LOCAL_MODEL?.trim();
    if (localModel) {
      return this.embedTextsByLocalTransformer(
        normalized,
        localModel,
        readEmbeddingRuntimeParameters(null),
      );
    }
    const runtime = await this.resolveEmbeddingRuntimeConfigFromEnv();
    if (!runtime) {
      throw new Error(
        'embedding is not configured: enable LlmModelConfig(kind=transformers_embedding) in DB or set AGENT_EMBEDDING_LOCAL_MODEL / AGENT_EMBEDDING_MODEL',
      );
    }
    return this.embedTextsByRemoteApiWithRuntime(normalized, runtime);
  }

  private async embedTextsByRemoteApi(
    texts: string[],
    config: LlmModelConfig,
  ): Promise<number[][]> {
    const runtime = await this.resolveEmbeddingRuntimeConfigFromRow(config);
    if (!runtime) {
      throw new Error('api_embedding config is incomplete');
    }
    return this.embedTextsByRemoteApiWithRuntime(texts, runtime);
  }

  private async embedTextsByRemoteApiWithRuntime(
    texts: string[],
    runtime: { url: string; apiKey: string; model: string },
  ): Promise<number[][]> {
    const response = await fetch(runtime.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      body: JSON.stringify({
        model: runtime.model,
        input: texts,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `embedding request failed (${response.status}): ${body.slice(0, 500)}`,
      );
    }
    const payload: unknown = await response.json();
    return this.parseEmbeddingResponse(payload, texts.length);
  }

  private async resolveEmbeddingRuntimeConfigFromEnv(): Promise<{
    url: string;
    apiKey: string;
    model: string;
  } | null> {
    const model = process.env.AGENT_EMBEDDING_MODEL?.trim();
    if (!model) {
      return null;
    }
    const chatConfig = await this.getCachedChatConfig();
    const baseUrl =
      process.env.AGENT_EMBEDDING_BASE_URL?.trim() || chatConfig.baseUrl;
    const chatPath =
      process.env.AGENT_EMBEDDING_CHAT_PATH?.trim() || chatConfig.chatPath;
    const embeddingPath =
      process.env.AGENT_EMBEDDING_PATH?.trim() || '/v1/embeddings';
    const url = this.resolveOpenAiCompatibleUrl(
      baseUrl,
      chatPath,
      embeddingPath,
    );
    const fromEmbeddingEnv = process.env.AGENT_EMBEDDING_API_KEY
      ? String(process.env.AGENT_EMBEDDING_API_KEY).trim()
      : '';
    const fromDb =
      chatConfig.apiKey != null ? String(chatConfig.apiKey).trim() : '';
    const fromEnv = process.env.OPENAI_API_KEY
      ? String(process.env.OPENAI_API_KEY).trim()
      : '';
    const apiKey = fromEmbeddingEnv || fromDb || fromEnv || 'local-internal';
    return { url, apiKey, model };
  }

  private async resolveEmbeddingRuntimeConfigFromRow(
    config: LlmModelConfig,
  ): Promise<{ url: string; apiKey: string; model: string } | null> {
    const model = config.model?.trim();
    if (!model) {
      return null;
    }
    const embeddingPath =
      process.env.AGENT_EMBEDDING_PATH?.trim() || '/v1/embeddings';
    const url = this.resolveOpenAiCompatibleUrl(
      config.baseUrl,
      config.chatPath,
      embeddingPath,
    );
    const apiKey =
      config.apiKey != null && String(config.apiKey).trim()
        ? String(config.apiKey).trim()
        : process.env.AGENT_EMBEDDING_API_KEY?.trim() ||
          process.env.OPENAI_API_KEY?.trim() ||
          'local-internal';
    return { url, apiKey, model };
  }

  async createLangChainChatModel(options?: {
    streaming?: boolean;
    temperature?: number;
    maxTokens?: number;
  }): Promise<ChatOpenAI> {
    const config = await this.getCachedConfig();
    const parameters = this.normalizeParameters(config.parameters);
    const resolvedTemperature =
      options?.temperature ??
      config.temperature ??
      this.pickNumber(parameters.temperature);
    const contextLength = this.resolveContextLength(parameters);
    const configuredOutput = this.normalizeConfiguredOutputMax(
      options?.maxTokens ??
        config.maxTokens ??
        this.pickNumber(parameters.maxTokens) ??
        LlmService.DEFAULT_OUTPUT_MAX_TOKENS,
      contextLength,
    );
    const fromDb = config.apiKey != null ? String(config.apiKey).trim() : '';
    const fromEnv = process.env.OPENAI_API_KEY
      ? String(process.env.OPENAI_API_KEY).trim()
      : '';
    // Must be non-empty: '' is treated as “no key” by the OpenAI client. Intranet gateways ignore it.
    const apiKey = fromDb || fromEnv || 'local-internal';
    const model = new ChatOpenAI({
      model: config.model,
      apiKey,
      temperature: resolvedTemperature ?? undefined,
      maxTokens: configuredOutput,
      streaming: options?.streaming ?? true,
      configuration: {
        baseURL: this.resolveLangChainBaseUrl(config.baseUrl, config.chatPath),
      },
    });
    return model;
  }

  /**
   * 为指定消息构建 LangChain Chat 模型，并由 LlmService 统一计算本次 maxTokens。
   * 调用方无需自行解析 contextLength / maxTokens 策略。
   */
  async createLangChainChatModelForMessages(
    messages: LlmChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      budgetHints?: PromptBudgetHints;
      messageTokenBudget?: number;
    },
  ): Promise<{ model: ChatOpenAI; maxTokens: number; messages: LlmChatMessage[] }> {
    const fitted = await this.fitMessagesToBudget(
      messages,
      options?.budgetHints,
      options?.messageTokenBudget,
    );
    const resolvedMaxTokens =
      options?.maxTokens ??
      (await this.resolveInvocationMaxTokens(fitted.messages));
    const model = await this.createLangChainChatModel({
      temperature: options?.temperature,
      maxTokens: resolvedMaxTokens,
    });
    return { model, maxTokens: resolvedMaxTokens, messages: fitted.messages };
  }

  private async invokeWithLangChain(
    input: LlmChatInput,
    forceStreaming: boolean,
    handlers?: LlmStreamHandlers,
  ): Promise<LlmChatResult> {
    const invocationMaxTokens = await this.resolveInvocationMaxTokens(
      input.messages,
    );
    const model = await this.createLangChainChatModel({
      streaming: forceStreaming || input.stream === true,
      temperature: input.temperature,
      maxTokens: input.maxTokens ?? invocationMaxTokens,
    });
    const runnable =
      input.tools && input.tools.length > 0
        ? model.bindTools(this.toLangChainTools(input.tools))
        : model.bindTools([]);
    const lcMessages = input.messages.map((message) => {
      if (message.role === 'tool') {
        return {
          role: message.role,
          content: message.content,
          tool_call_id: message.toolCallId ?? 'tool_result',
        };
      }
      return {
        role: message.role,
        content: message.content,
      };
    });

    if (handlers?.onDelta) {
      return this.invokeWithStream(
        runnable as {
          stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
          invoke: (messages: unknown[]) => Promise<AIMessage>;
        },
        lcMessages,
        model.model,
        handlers,
        input.signal,
      );
    }

    if (input.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const response = (await runnable.invoke(lcMessages)) as AIMessage;
    const content = this.extractAiMessageContent(response.content);
    const toolCalls = this.extractToolCalls(response);
    const modelName = this.extractModelName(
      response.response_metadata as Record<string, unknown> | undefined,
      model.model,
    );
    return {
      content,
      toolCalls,
      model: modelName,
      raw: response,
    };
  }

  private async invokeWithStream(
    runnable: {
      stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
      invoke: (messages: unknown[]) => Promise<AIMessage>;
    },
    messages: unknown[],
    modelFallback: string,
    handlers: LlmStreamHandlers,
    signal?: AbortSignal,
  ): Promise<LlmChatResult> {
    let merged: AIMessageChunk | undefined;
    let content = '';
    let emittedDeltaCount = 0;
    let streamChunkCount = 0;
    let emptyStreamChunkCount = 0;
    let reasoningOnlyChunkCount = 0;
    try {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      const stream = await runnable.stream(messages);
      for await (const chunk of stream) {
        if (signal?.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
        const row = chunk as AIMessageChunk;
        streamChunkCount += 1;
        let delta = this.extractAiMessageContent(row.content);
        if (!delta) {
          const reasoningDelta = this.extractAiMessageReasoning(row);
          if (reasoningDelta) {
            reasoningOnlyChunkCount += 1;
            delta = reasoningDelta;
            if (emittedDeltaCount === 0 && reasoningOnlyChunkCount === 1) {
              this.logger.warn(
                `[LlmService] stream using reasoning_content fallback (model=${modelFallback})`,
              );
            }
          } else {
            emptyStreamChunkCount += 1;
          }
        }
        if (delta) {
          content += delta;
          emittedDeltaCount += 1;
          handlers.onDelta?.({
            model: this.extractModelName(
              row.response_metadata as Record<string, unknown> | undefined,
              modelFallback,
            ),
            contentDelta: delta,
            toolCalls: [],
            done: false,
            raw: row,
          });
        }
        merged = merged ? merged.concat(row) : row;
      }
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw error;
      }
      this.logger.warn(
        `llm stream failed, fallback invoke: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const response = await runnable.invoke(messages);
      content =
        this.extractAiMessageContent(response.content) ||
        this.extractAiMessageReasoning(response);
      merged = undefined;
      if (emittedDeltaCount === 0 && content) {
        this.logger.warn(
          `[LlmService] stream fellBackToInvoke with contentLen=${content.length} (model=${modelFallback})`,
        );
      }
      return {
        content,
        toolCalls: this.extractToolCalls(response),
        model: this.extractModelName(
          response.response_metadata as Record<string, unknown> | undefined,
          modelFallback,
        ),
        raw: response,
        streamMeta: {
          emittedDeltaCount,
          fellBackToInvoke: true,
        },
      };
    }

    const response = merged
      ? new AIMessage({
          content: merged.content,
          tool_calls: merged.tool_calls,
          additional_kwargs: merged.additional_kwargs,
          response_metadata: merged.response_metadata,
        })
      : new AIMessage({ content });
    const toolCalls = this.extractToolCalls(response);
    const modelName = this.extractModelName(
      response.response_metadata as Record<string, unknown> | undefined,
      modelFallback,
    );
    const mergedContent =
      content ||
      this.extractAiMessageContent(response.content) ||
      (merged ? this.extractAiMessageReasoning(merged) : '');
    if (emittedDeltaCount === 0 && streamChunkCount > 0) {
      this.logger.warn(
        `[LlmService] stream ended with zero content deltas model=${modelName}` +
          ` chunks=${streamChunkCount} emptyChunks=${emptyStreamChunkCount}` +
          ` reasoningOnlyChunks=${reasoningOnlyChunkCount}` +
          ` mergedContentLen=${mergedContent.length}`,
      );
    }
    handlers.onDelta?.({
      model: modelName,
      contentDelta: '',
      toolCalls,
      done: true,
      raw: response,
    });
    return {
      content: mergedContent,
      toolCalls,
      model: modelName,
      raw: response,
      streamMeta: {
        emittedDeltaCount,
        fellBackToInvoke: false,
      },
    };
  }

  private async getCachedChatConfig(): Promise<LlmModelConfig> {
    const fromRedis = await this.modelConfigCache.getActive(LlmModelKind.chat);
    if (fromRedis?.enabled) {
      return fromRedis;
    }
    const fromDb = await this.loadActiveConfigFromDb(LlmModelKind.chat);
    await this.modelConfigCache.trySetActive(fromDb);
    return fromDb;
  }

  private async getCachedEmbeddingConfig(): Promise<LlmModelConfig | null> {
    const fromRedis = await this.loadActiveEmbeddingConfigFromRedis();
    if (fromRedis) {
      return fromRedis;
    }
    const fromDb = await this.loadActiveEmbeddingConfigFromDb();
    if (fromDb) {
      await this.modelConfigCache.trySetActive(fromDb);
    }
    return fromDb;
  }

  private async loadActiveEmbeddingConfigFromRedis(): Promise<LlmModelConfig | null> {
    const transformers = await this.modelConfigCache.getActive(
      LlmModelKind.transformers_embedding,
    );
    if (transformers?.enabled) {
      return transformers;
    }
    const api = await this.modelConfigCache.getActive(LlmModelKind.api_embedding);
    if (api?.enabled) {
      return api;
    }
    return null;
  }

  /** @deprecated 使用 getCachedChatConfig */
  private async getCachedConfig(): Promise<LlmModelConfig> {
    return this.getCachedChatConfig();
  }

  private async loadActiveConfigFromDb(
    kind: LlmModelKind,
  ): Promise<LlmModelConfig> {
    const config = await this.prisma.llmModelConfig.findFirst({
      where: { enabled: true, kind },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (!config) {
      throw new NotFoundException(
        `no enabled llm model config found for kind=${kind}`,
      );
    }
    return config;
  }

  private async loadActiveEmbeddingConfigFromDb(): Promise<LlmModelConfig | null> {
    const transformers = await this.prisma.llmModelConfig.findFirst({
      where: {
        enabled: true,
        kind: LlmModelKind.transformers_embedding,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (transformers) {
      return transformers;
    }
    return this.prisma.llmModelConfig.findFirst({
      where: { enabled: true, kind: LlmModelKind.api_embedding },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  private normalizeParameters(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private async embedTextsByLocalTransformer(
    texts: string[],
    model: string,
    runtimeParams: ReturnType<typeof readEmbeddingRuntimeParameters>,
  ): Promise<number[][]> {
    const runtime = await this.resolveLocalEmbeddingRuntime(model, runtimeParams);
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += LlmService.LOCAL_EMBED_BATCH_SIZE) {
      const batch = texts.slice(i, i + LlmService.LOCAL_EMBED_BATCH_SIZE);
      const out = await runtime.extractor(batch, {
        pooling: 'mean',
        normalize: true,
      });
      const parsed = this.parseLocalEmbeddingOutput(out, batch.length);
      vectors.push(...parsed);
    }
    return vectors;
  }

  private async resolveLocalEmbeddingRuntime(
    model: string,
    runtimeParams: ReturnType<typeof readEmbeddingRuntimeParameters>,
  ): Promise<{
    model: string;
    extractor: (
      input: string | string[],
      options?: Record<string, unknown>,
    ) => Promise<unknown>;
  }> {
    const cacheKey = `${model}::${runtimeParams.localModelPath ?? ''}::${runtimeParams.allowRemoteModels}`;
    if (this.localEmbeddingRuntime?.model === cacheKey) {
      return this.localEmbeddingRuntime;
    }
    // transformers.js 使用动态导入，避免默认路径下增加启动成本。
    const mod = (await import('@xenova/transformers')) as {
      pipeline: (
        task: string,
        model: string,
        options?: Record<string, unknown>,
      ) => Promise<
        (input: string | string[], options?: Record<string, unknown>) => Promise<unknown>
      >;
      env?: { allowRemoteModels?: boolean; localModelPath?: string };
    };
    let localModelPath = runtimeParams.localModelPath;
    let resolvedModel = model;
    const modelUrl = this.tryParseHttpUrl(model);
    // 兼容完整 URL：
    // AGENT_EMBEDDING_LOCAL_MODEL=https://host/path/all-MiniLM-L6-v2
    // -> localModelPath=https://host/path, model=all-MiniLM-L6-v2
    if (modelUrl && !localModelPath) {
      const normalized = modelUrl.pathname.replace(/\/+$/, '');
      const slash = normalized.lastIndexOf('/');
      if (slash > 0) {
        const modelName = normalized.slice(slash + 1);
        const parentPath = normalized.slice(0, slash);
        if (modelName) {
          resolvedModel = modelName;
          localModelPath = `${modelUrl.origin}${parentPath}`;
          this.logger.log(
            `embedding model URL detected, resolved model=${resolvedModel}, localModelPath=${localModelPath}`,
          );
        }
      }
    }
    if (mod.env) {
      mod.env.allowRemoteModels = runtimeParams.allowRemoteModels;
      if (localModelPath) {
        mod.env.localModelPath = localModelPath;
      }
    }
    const extractor = await mod.pipeline('feature-extraction', resolvedModel);
    this.localEmbeddingRuntime = {
      model: cacheKey,
      extractor,
    };
    this.logger.log(
      `local embedding model loaded: ${resolvedModel} allowRemote=${runtimeParams.allowRemoteModels}`,
    );
    return this.localEmbeddingRuntime;
  }

  private tryParseHttpUrl(value: string): URL | null {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseLocalEmbeddingOutput(out: unknown, expected: number): number[][] {
    // transformers.js tensor path
    const maybeData = out as {
      data?: Float32Array | number[];
      dims?: number[];
      type?: string;
    };
    if (maybeData?.data && Array.isArray(maybeData.dims) && maybeData.dims.length === 2) {
      const rows = maybeData.dims[0];
      const cols = maybeData.dims[1];
      const raw = Array.from(maybeData.data as ArrayLike<number>);
      if (rows > 0 && cols > 0 && raw.length === rows * cols) {
        const vectors: number[][] = [];
        for (let r = 0; r < rows; r += 1) {
          vectors.push(raw.slice(r * cols, (r + 1) * cols));
        }
        return vectors.slice(0, expected);
      }
    }

    // Already nested array
    if (
      Array.isArray(out) &&
      out.every((row) => Array.isArray(row) && row.every((n) => typeof n === 'number'))
    ) {
      return (out as number[][]).slice(0, expected);
    }

    // tensor.tolist() path
    const maybeToList = out as { tolist?: () => unknown };
    if (typeof maybeToList?.tolist === 'function') {
      const listed = maybeToList.tolist();
      if (
        Array.isArray(listed) &&
        listed.every((row) => Array.isArray(row) && row.every((n) => typeof n === 'number'))
      ) {
        return (listed as number[][]).slice(0, expected);
      }
    }

    throw new Error('unable to parse local embedding output');
  }

  private pickNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return null;
  }

  private resolveContextLength(
    parameters: Record<string, unknown>,
  ): number | null {
    return (
      this.pickNumber(parameters.contextLength) ??
      this.pickNumber(parameters.maxContextTokens) ??
      this.pickNumber(parameters.context_window)
    );
  }

  /**
   * maxTokens 字段表示「输出上限」；若配置成 ≥ 上下文窗口则按误配处理。
   */
  private normalizeConfiguredOutputMax(
    raw: number,
    contextLength: number | null,
  ): number {
    if (raw <= 0) {
      return LlmService.DEFAULT_OUTPUT_MAX_TOKENS;
    }
    if (contextLength == null) {
      // 未配置上下文窗口时，避免把整段 context（如 32768）误当输出上限透传给模型。
      if (raw > LlmService.DEFAULT_OUTPUT_MAX_TOKENS) {
        this.logger.warn(
          `llm contextLength is missing; clamp maxTokens=${raw} to safe default ${LlmService.DEFAULT_OUTPUT_MAX_TOKENS}`,
        );
      }
      return Math.min(raw, LlmService.DEFAULT_OUTPUT_MAX_TOKENS);
    }
    if (raw >= contextLength) {
      const capped = Math.min(
        LlmService.DEFAULT_OUTPUT_MAX_TOKENS,
        Math.max(512, Math.floor(contextLength / 4)),
      );
      this.logger.warn(
        `llm maxTokens=${raw} is >= contextLength=${contextLength}; using output cap ${capped} instead`,
      );
      return capped;
    }
    return raw;
  }

  private capOutputMaxTokens(
    configuredOutput: number,
    contextLength: number | null,
    inputTokens: number,
  ): number {
    if (contextLength == null) {
      return configuredOutput;
    }
    const available =
      contextLength -
      inputTokens -
      LlmService.INVOCATION_TOKEN_BUFFER;
    if (available < configuredOutput) {
      return Math.max(256, available);
    }
    return configuredOutput;
  }

  private resolveLangChainBaseUrl(baseUrl: string, chatPath: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const normalizedPath = chatPath.trim();
    if (!normalizedPath) {
      return normalizedBase;
    }
    const withoutChatCompletions = normalizedPath.replace(
      /\/chat\/completions\/?$/i,
      '',
    );
    if (!withoutChatCompletions || withoutChatCompletions === '/') {
      return normalizedBase;
    }
    const prefix = withoutChatCompletions.startsWith('/')
      ? withoutChatCompletions
      : `/${withoutChatCompletions}`;
    return `${normalizedBase}${prefix}`.replace(/\/+$/, '');
  }

  private resolveOpenAiCompatibleUrl(
    baseUrl: string,
    chatPath: string,
    resourcePath: string,
  ): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const path = resourcePath.trim();
    if (!path) {
      return normalizedBase;
    }
    const absolutePath = path.startsWith('/') ? path : `/${path}`;
    const apiPrefix = this.resolveLangChainBaseUrl(baseUrl, chatPath);
    if (absolutePath.startsWith('/v1/') && apiPrefix.endsWith('/v1')) {
      return `${apiPrefix}${absolutePath.slice(3)}`;
    }
    return `${normalizedBase}${absolutePath}`;
  }

  private parseEmbeddingResponse(
    payload: unknown,
    expectedCount: number,
  ): number[][] {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('invalid embedding response');
    }
    const data = (payload as Record<string, unknown>).data;
    if (!Array.isArray(data)) {
      throw new Error('embedding response missing data');
    }
    const rows = data
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        const index =
          typeof row.index === 'number' && Number.isInteger(row.index)
            ? row.index
            : null;
        const embedding = row.embedding;
        if (!Array.isArray(embedding)) {
          return null;
        }
        const vector = embedding.filter(
          (value): value is number =>
            typeof value === 'number' && Number.isFinite(value),
        );
        if (vector.length === 0) {
          return null;
        }
        return { index, vector };
      })
      .filter((item) => item !== null) as Array<{
      index: number | null;
      vector: number[];
    }>;
    if (rows.length === 0) {
      throw new Error('embedding response has no vectors');
    }
    const ordered = new Array<number[]>(expectedCount);
    for (const row of rows) {
      const slot = row.index ?? ordered.findIndex((item) => item == null);
      if (slot >= 0 && slot < expectedCount) {
        ordered[slot] = row.vector;
      }
    }
    if (ordered.some((item) => !item)) {
      throw new Error('embedding response count mismatch');
    }
    return ordered;
  }

  private toLangChainTools(
    tools: LlmToolDefinition[],
  ): Array<Record<string, unknown>> {
    return tools
      .map((tool) => {
        if (!tool?.function?.name) {
          return null;
        }
        return {
          type: 'function',
          function: {
            name: tool.function.name,
            description: tool.function.description ?? '',
            parameters: tool.function.parameters ?? {
              type: 'object',
              properties: {},
            },
          },
        };
      })
      .filter((item) => item !== null) as Array<Record<string, unknown>>;
  }

  private extractAiMessageReasoning(
    message: Pick<AIMessageChunk, 'additional_kwargs'>,
  ): string {
    const kwargs = message.additional_kwargs as Record<string, unknown> | undefined;
    if (!kwargs) {
      return '';
    }
    const reasoning = kwargs.reasoning_content;
    return typeof reasoning === 'string' ? reasoning : '';
  }

  private extractAiMessageContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (!Array.isArray(content)) {
      return '';
    }
    return content
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return '';
        }
        const row = item as Record<string, unknown>;
        const text = row.text;
        return typeof text === 'string' ? text : '';
      })
      .join('');
  }

  private extractToolCalls(message: AIMessage): LlmToolCall[] {
    const value = (message.tool_calls ??
      message.additional_kwargs?.tool_calls ??
      []) as unknown[];
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        if (typeof row.name === 'string') {
          return {
            name: row.name,
            arguments: normalizeToolArguments(row.args),
          };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
          return null;
        }
        const fnRow = fn as Record<string, unknown>;
        if (typeof fnRow.name !== 'string') {
          return null;
        }
        return {
          name: fnRow.name,
          arguments: normalizeToolArguments(fnRow.arguments),
        };
      })
      .filter((item) => item !== null) as LlmToolCall[];
  }

  private extractModelName(
    responseMeta: Record<string, unknown> | undefined,
    fallback: string,
  ): string {
    const modelName = responseMeta?.model_name;
    if (typeof modelName === 'string' && modelName.trim()) {
      return modelName;
    }
    return fallback;
  }
}
