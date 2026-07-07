"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var LlmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const messages_1 = require("@langchain/core/messages");
const openai_1 = require("@langchain/openai");
const client_1 = require("../../../generated/prisma/client");
const llm_embedding_parameters_util_1 = require("./llm-embedding-parameters.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const outbound_http_service_1 = require("../outbound-http/outbound-http.service");
const outbound_http_policy_util_1 = require("../outbound-http/outbound-http.policy.util");
const outbound_http_types_1 = require("../outbound-http/outbound-http.types");
const llm_model_config_cache_store_1 = require("./llm-model-config-cache.store");
const tool_call_args_util_1 = require("./tool-call-args.util");
const message_token_budget_util_1 = require("./message-token-budget.util");
const prompt_budget_service_1 = require("./prompt-budget/prompt-budget.service");
let LlmService = LlmService_1 = class LlmService {
    constructor(prisma, modelConfigCache, promptBudgetService, outboundHttp) {
        this.prisma = prisma;
        this.modelConfigCache = modelConfigCache;
        this.promptBudgetService = promptBudgetService;
        this.outboundHttp = outboundHttp;
        this.logger = new common_1.Logger(LlmService_1.name);
        this.localEmbeddingRuntime = null;
    }
    async onModuleInit() {
        try {
            await this.refreshConfigCache();
        }
        catch (error) {
            this.logger.warn(`skip llm config preload on startup: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async refreshConfigCache() {
        const chat = await this.loadActiveConfigFromDb(client_1.LlmModelKind.chat);
        await this.modelConfigCache.trySetActive(chat);
        const embedding = await this.loadActiveEmbeddingConfigFromDb();
        await this.modelConfigCache.deleteActive(client_1.LlmModelKind.transformers_embedding);
        await this.modelConfigCache.deleteActive(client_1.LlmModelKind.api_embedding);
        if (embedding) {
            await this.modelConfigCache.trySetActive(embedding);
        }
        this.localEmbeddingRuntime = null;
    }
    async chat(input) {
        const messages = await this.applyPromptBudget(input);
        return this.invokeWithLangChain(Object.assign(Object.assign({}, input), { messages }), false);
    }
    async streamChat(input, handlers) {
        const messages = await this.applyPromptBudget(input);
        return this.invokeWithLangChain(Object.assign(Object.assign({}, input), { messages }), true, handlers);
    }
    async getActiveChatModelConfig() {
        return this.getCachedChatConfig();
    }
    async getContextLength() {
        const config = await this.getCachedConfig();
        return this.resolveContextLength(this.normalizeParameters(config.parameters));
    }
    async getResolvedMaxTokens() {
        var _a, _b;
        const config = await this.getCachedConfig();
        const parameters = this.normalizeParameters(config.parameters);
        const contextLength = this.resolveContextLength(parameters);
        const raw = (_b = (_a = config.maxTokens) !== null && _a !== void 0 ? _a : this.pickNumber(parameters.maxTokens)) !== null && _b !== void 0 ? _b : LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS;
        return this.normalizeConfiguredOutputMax(raw, contextLength);
    }
    async resolveInvocationMaxTokens(messages) {
        var _a, _b;
        const config = await this.getCachedConfig();
        const parameters = this.normalizeParameters(config.parameters);
        const contextLength = this.resolveContextLength(parameters);
        const configuredOutput = this.normalizeConfiguredOutputMax((_b = (_a = config.maxTokens) !== null && _a !== void 0 ? _a : this.pickNumber(parameters.maxTokens)) !== null && _b !== void 0 ? _b : LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS, contextLength);
        const inputTokens = (0, message_token_budget_util_1.estimateMessagesTokens)(messages);
        return this.capOutputMaxTokens(configuredOutput, contextLength, inputTokens);
    }
    async getMessageTokenBudget() {
        const outputReserve = await this.getResolvedMaxTokens();
        const contextLength = await this.getContextLength();
        if (contextLength != null && contextLength > outputReserve) {
            return contextLength - outputReserve;
        }
        return outputReserve;
    }
    async trimMessagesToBudget(messages, hints, budgetOverride) {
        const result = await this.fitMessagesToBudget(messages, hints, budgetOverride);
        return result.messages;
    }
    async fitMessagesToBudget(messages, hints, budgetOverride) {
        const budget = budgetOverride !== null && budgetOverride !== void 0 ? budgetOverride : (await this.getMessageTokenBudget());
        return this.promptBudgetService.fitMessages(messages, budget, hints);
    }
    async applyPromptBudget(input) {
        const result = await this.fitMessagesToBudget(input.messages, input.budgetHints, input.messageTokenBudget);
        return result.messages;
    }
    async isEmbeddingConfigured() {
        var _a, _b;
        const db = await this.getCachedEmbeddingConfig();
        if (db) {
            return true;
        }
        return (!!((_a = process.env.AGENT_EMBEDDING_MODEL) === null || _a === void 0 ? void 0 : _a.trim()) ||
            !!((_b = process.env.AGENT_EMBEDDING_LOCAL_MODEL) === null || _b === void 0 ? void 0 : _b.trim()));
    }
    async embedTexts(texts) {
        var _a;
        const normalized = texts.map((text) => text.trim()).filter(Boolean);
        if (normalized.length === 0) {
            return [];
        }
        const dbEmbedding = await this.getCachedEmbeddingConfig();
        if ((dbEmbedding === null || dbEmbedding === void 0 ? void 0 : dbEmbedding.kind) === client_1.LlmModelKind.transformers_embedding) {
            const runtimeParams = (0, llm_embedding_parameters_util_1.readEmbeddingRuntimeParameters)(dbEmbedding);
            return this.embedTextsByLocalTransformer(normalized, dbEmbedding.model, runtimeParams);
        }
        if ((dbEmbedding === null || dbEmbedding === void 0 ? void 0 : dbEmbedding.kind) === client_1.LlmModelKind.api_embedding) {
            return this.embedTextsByRemoteApi(normalized, dbEmbedding);
        }
        const localModel = (_a = process.env.AGENT_EMBEDDING_LOCAL_MODEL) === null || _a === void 0 ? void 0 : _a.trim();
        if (localModel) {
            return this.embedTextsByLocalTransformer(normalized, localModel, (0, llm_embedding_parameters_util_1.readEmbeddingRuntimeParameters)(null));
        }
        const runtime = await this.resolveEmbeddingRuntimeConfigFromEnv();
        if (!runtime) {
            throw new Error('embedding is not configured: enable LlmModelConfig(kind=transformers_embedding) in DB or set AGENT_EMBEDDING_LOCAL_MODEL / AGENT_EMBEDDING_MODEL');
        }
        return this.embedTextsByRemoteApiWithRuntime(normalized, runtime);
    }
    async embedTextsByRemoteApi(texts, config) {
        const runtime = await this.resolveEmbeddingRuntimeConfigFromRow(config);
        if (!runtime) {
            throw new Error('api_embedding config is incomplete');
        }
        return this.embedTextsByRemoteApiWithRuntime(texts, runtime);
    }
    async embedTextsByRemoteApiWithRuntime(texts, runtime) {
        const response = await this.outboundHttp.fetchWithPolicy(runtime.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${runtime.apiKey}`,
            },
            body: JSON.stringify({
                model: runtime.model,
                input: texts,
            }),
        }, {
            timeoutMs: (0, outbound_http_policy_util_1.readLlmEmbeddingTimeoutMs)(),
            label: 'llm_embedding',
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`embedding request failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const payload = await response.json();
        return this.parseEmbeddingResponse(payload, texts.length);
    }
    async resolveEmbeddingRuntimeConfigFromEnv() {
        var _a, _b, _c, _d;
        const model = (_a = process.env.AGENT_EMBEDDING_MODEL) === null || _a === void 0 ? void 0 : _a.trim();
        if (!model) {
            return null;
        }
        const chatConfig = await this.getCachedChatConfig();
        const baseUrl = ((_b = process.env.AGENT_EMBEDDING_BASE_URL) === null || _b === void 0 ? void 0 : _b.trim()) || chatConfig.baseUrl;
        const chatPath = ((_c = process.env.AGENT_EMBEDDING_CHAT_PATH) === null || _c === void 0 ? void 0 : _c.trim()) || chatConfig.chatPath;
        const embeddingPath = ((_d = process.env.AGENT_EMBEDDING_PATH) === null || _d === void 0 ? void 0 : _d.trim()) || '/v1/embeddings';
        const url = this.resolveOpenAiCompatibleUrl(baseUrl, chatPath, embeddingPath);
        const fromEmbeddingEnv = process.env.AGENT_EMBEDDING_API_KEY
            ? String(process.env.AGENT_EMBEDDING_API_KEY).trim()
            : '';
        const fromDb = chatConfig.apiKey != null ? String(chatConfig.apiKey).trim() : '';
        const fromEnv = process.env.OPENAI_API_KEY
            ? String(process.env.OPENAI_API_KEY).trim()
            : '';
        const apiKey = fromEmbeddingEnv || fromDb || fromEnv || 'local-internal';
        return { url, apiKey, model };
    }
    async resolveEmbeddingRuntimeConfigFromRow(config) {
        var _a, _b, _c, _d;
        const model = (_a = config.model) === null || _a === void 0 ? void 0 : _a.trim();
        if (!model) {
            return null;
        }
        const embeddingPath = ((_b = process.env.AGENT_EMBEDDING_PATH) === null || _b === void 0 ? void 0 : _b.trim()) || '/v1/embeddings';
        const url = this.resolveOpenAiCompatibleUrl(config.baseUrl, config.chatPath, embeddingPath);
        const apiKey = config.apiKey != null && String(config.apiKey).trim()
            ? String(config.apiKey).trim()
            : ((_c = process.env.AGENT_EMBEDDING_API_KEY) === null || _c === void 0 ? void 0 : _c.trim()) ||
                ((_d = process.env.OPENAI_API_KEY) === null || _d === void 0 ? void 0 : _d.trim()) ||
                'local-internal';
        return { url, apiKey, model };
    }
    async createLangChainChatModel(options) {
        const config = await this.getCachedConfig();
        return this.buildChatOpenAiFromConfig(config, options);
    }
    async testModelConfigConnection(configId) {
        const config = await this.prisma.llmModelConfig.findUnique({
            where: { id: configId },
        });
        if (!config) {
            throw new common_1.NotFoundException(`llm model config ${configId} not found`);
        }
        const startedAt = Date.now();
        const base = {
            configId: config.id,
            kind: config.kind,
            provider: config.provider,
            model: config.model,
            durationMs: 0,
        };
        try {
            if (config.kind === client_1.LlmModelKind.chat) {
                const model = await this.buildChatOpenAiFromConfig(config, {
                    streaming: false,
                    maxTokens: 1,
                    temperature: 0,
                });
                await model.invoke([{ role: 'user', content: 'ping' }]);
                return Object.assign(Object.assign({}, base), { ok: true, probe: 'chat', durationMs: Date.now() - startedAt });
            }
            if (config.kind === client_1.LlmModelKind.api_embedding) {
                await this.embedTextsByRemoteApi(['ping'], config);
                return Object.assign(Object.assign({}, base), { ok: true, probe: 'embedding_api', durationMs: Date.now() - startedAt });
            }
            if (config.kind === client_1.LlmModelKind.transformers_embedding) {
                const runtimeParams = (0, llm_embedding_parameters_util_1.readEmbeddingRuntimeParameters)(config);
                await this.embedTextsByLocalTransformer(['ping'], config.model, runtimeParams);
                return Object.assign(Object.assign({}, base), { ok: true, probe: 'embedding_local', durationMs: Date.now() - startedAt, detail: { note: 'local transformers embedding loaded successfully' } });
            }
            return Object.assign(Object.assign({}, base), { ok: false, probe: 'unsupported', durationMs: Date.now() - startedAt, error: `kind ${config.kind} does not support connectivity probe` });
        }
        catch (error) {
            return Object.assign(Object.assign({}, base), { ok: false, probe: config.kind === client_1.LlmModelKind.chat
                    ? 'chat'
                    : config.kind === client_1.LlmModelKind.api_embedding
                        ? 'embedding_api'
                        : config.kind === client_1.LlmModelKind.transformers_embedding
                            ? 'embedding_local'
                            : 'unsupported', durationMs: Date.now() - startedAt, error: this.formatConnectionTestError(error) });
        }
    }
    async testActiveChatConnection() {
        const config = await this.getCachedChatConfig();
        return this.testModelConfigConnection(config.id);
    }
    async testActiveEmbeddingConnection() {
        const config = await this.getCachedEmbeddingConfig();
        if (!config) {
            return null;
        }
        return this.testModelConfigConnection(config.id);
    }
    buildChatOpenAiFromConfig(config, options) {
        var _a, _b, _c, _d, _e, _f;
        const parameters = this.normalizeParameters(config.parameters);
        const resolvedTemperature = (_b = (_a = options === null || options === void 0 ? void 0 : options.temperature) !== null && _a !== void 0 ? _a : config.temperature) !== null && _b !== void 0 ? _b : this.pickNumber(parameters.temperature);
        const contextLength = this.resolveContextLength(parameters);
        const configuredOutput = this.normalizeConfiguredOutputMax((_e = (_d = (_c = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _c !== void 0 ? _c : config.maxTokens) !== null && _d !== void 0 ? _d : this.pickNumber(parameters.maxTokens)) !== null && _e !== void 0 ? _e : LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS, contextLength);
        const fromDb = config.apiKey != null ? String(config.apiKey).trim() : '';
        const fromEnv = process.env.OPENAI_API_KEY
            ? String(process.env.OPENAI_API_KEY).trim()
            : '';
        const apiKey = fromDb || fromEnv || 'local-internal';
        return new openai_1.ChatOpenAI({
            model: config.model,
            apiKey,
            temperature: resolvedTemperature !== null && resolvedTemperature !== void 0 ? resolvedTemperature : undefined,
            maxTokens: configuredOutput,
            streaming: (_f = options === null || options === void 0 ? void 0 : options.streaming) !== null && _f !== void 0 ? _f : true,
            timeout: (0, outbound_http_policy_util_1.readLlmOutboundTimeoutMs)(),
            maxRetries: 0,
            configuration: {
                baseURL: this.resolveLangChainBaseUrl(config.baseUrl, config.chatPath),
            },
        });
    }
    formatConnectionTestError(error) {
        if (error instanceof outbound_http_types_1.OutboundHttpError) {
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    async createLangChainChatModelForMessages(messages, options) {
        var _a;
        const fitted = await this.fitMessagesToBudget(messages, options === null || options === void 0 ? void 0 : options.budgetHints, options === null || options === void 0 ? void 0 : options.messageTokenBudget);
        const resolvedMaxTokens = (_a = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _a !== void 0 ? _a : (await this.resolveInvocationMaxTokens(fitted.messages));
        const model = await this.createLangChainChatModel({
            temperature: options === null || options === void 0 ? void 0 : options.temperature,
            maxTokens: resolvedMaxTokens,
        });
        return { model, maxTokens: resolvedMaxTokens, messages: fitted.messages };
    }
    async invokeWithLangChain(input, forceStreaming, handlers) {
        var _a, _b;
        const invocationMaxTokens = await this.resolveInvocationMaxTokens(input.messages);
        const model = await this.createLangChainChatModel({
            streaming: forceStreaming || input.stream === true,
            temperature: input.temperature,
            maxTokens: (_a = input.maxTokens) !== null && _a !== void 0 ? _a : invocationMaxTokens,
        });
        const runnable = input.tools && input.tools.length > 0
            ? model.bindTools(this.toLangChainTools(input.tools))
            : model.bindTools([]);
        const lcMessages = input.messages.map((message) => {
            var _a;
            if (message.role === 'tool') {
                return {
                    role: message.role,
                    content: message.content,
                    tool_call_id: (_a = message.toolCallId) !== null && _a !== void 0 ? _a : 'tool_result',
                };
            }
            return {
                role: message.role,
                content: message.content,
            };
        });
        if (handlers === null || handlers === void 0 ? void 0 : handlers.onDelta) {
            return this.invokeWithStream(runnable, lcMessages, model.model, handlers, input.signal);
        }
        if ((_b = input.signal) === null || _b === void 0 ? void 0 : _b.aborted) {
            throw new DOMException('The operation was aborted.', 'AbortError');
        }
        const response = (await runnable.invoke(lcMessages));
        const content = this.extractAiMessageContent(response.content);
        const toolCalls = this.extractToolCalls(response);
        const modelName = this.extractModelName(response.response_metadata, model.model);
        return {
            content,
            toolCalls,
            model: modelName,
            raw: response,
        };
    }
    async invokeWithStream(runnable, messages, modelFallback, handlers, signal) {
        var _a, e_1, _b, _c;
        var _d, _e;
        let merged;
        let content = '';
        let emittedDeltaCount = 0;
        let streamChunkCount = 0;
        let emptyStreamChunkCount = 0;
        let reasoningOnlyChunkCount = 0;
        try {
            if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                throw new DOMException('The operation was aborted.', 'AbortError');
            }
            const stream = await runnable.stream(messages);
            try {
                for (var _f = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a;) {
                    _c = stream_1_1.value;
                    _f = false;
                    try {
                        const chunk = _c;
                        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                            throw new DOMException('The operation was aborted.', 'AbortError');
                        }
                        const row = chunk;
                        streamChunkCount += 1;
                        let delta = this.extractAiMessageContent(row.content);
                        if (!delta) {
                            const reasoningDelta = this.extractAiMessageReasoning(row);
                            if (reasoningDelta) {
                                reasoningOnlyChunkCount += 1;
                                delta = reasoningDelta;
                                if (emittedDeltaCount === 0 && reasoningOnlyChunkCount === 1) {
                                    this.logger.warn(`[LlmService] stream using reasoning_content fallback (model=${modelFallback})`);
                                }
                            }
                            else {
                                emptyStreamChunkCount += 1;
                            }
                        }
                        if (delta) {
                            content += delta;
                            emittedDeltaCount += 1;
                            (_d = handlers.onDelta) === null || _d === void 0 ? void 0 : _d.call(handlers, {
                                model: this.extractModelName(row.response_metadata, modelFallback),
                                contentDelta: delta,
                                toolCalls: [],
                                done: false,
                                raw: row,
                            });
                        }
                        merged = merged ? merged.concat(row) : row;
                    }
                    finally {
                        _f = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_f && !_a && (_b = stream_1.return)) await _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            if ((signal === null || signal === void 0 ? void 0 : signal.aborted) || (error instanceof DOMException && error.name === 'AbortError')) {
                throw error;
            }
            this.logger.warn(`llm stream failed, fallback invoke: ${error instanceof Error ? error.message : String(error)}`);
            const response = await runnable.invoke(messages);
            content =
                this.extractAiMessageContent(response.content) ||
                    this.extractAiMessageReasoning(response);
            merged = undefined;
            if (emittedDeltaCount === 0 && content) {
                this.logger.warn(`[LlmService] stream fellBackToInvoke with contentLen=${content.length} (model=${modelFallback})`);
            }
            return {
                content,
                toolCalls: this.extractToolCalls(response),
                model: this.extractModelName(response.response_metadata, modelFallback),
                raw: response,
                streamMeta: {
                    emittedDeltaCount,
                    fellBackToInvoke: true,
                },
            };
        }
        const response = merged
            ? new messages_1.AIMessage({
                content: merged.content,
                tool_calls: merged.tool_calls,
                additional_kwargs: merged.additional_kwargs,
                response_metadata: merged.response_metadata,
            })
            : new messages_1.AIMessage({ content });
        const toolCalls = this.extractToolCalls(response);
        const modelName = this.extractModelName(response.response_metadata, modelFallback);
        const mergedContent = content ||
            this.extractAiMessageContent(response.content) ||
            (merged ? this.extractAiMessageReasoning(merged) : '');
        if (emittedDeltaCount === 0 && streamChunkCount > 0) {
            this.logger.warn(`[LlmService] stream ended with zero content deltas model=${modelName}` +
                ` chunks=${streamChunkCount} emptyChunks=${emptyStreamChunkCount}` +
                ` reasoningOnlyChunks=${reasoningOnlyChunkCount}` +
                ` mergedContentLen=${mergedContent.length}`);
        }
        (_e = handlers.onDelta) === null || _e === void 0 ? void 0 : _e.call(handlers, {
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
    async getCachedChatConfig() {
        const fromRedis = await this.modelConfigCache.getActive(client_1.LlmModelKind.chat);
        if (fromRedis === null || fromRedis === void 0 ? void 0 : fromRedis.enabled) {
            return fromRedis;
        }
        const fromDb = await this.loadActiveConfigFromDb(client_1.LlmModelKind.chat);
        await this.modelConfigCache.trySetActive(fromDb);
        return fromDb;
    }
    async getCachedEmbeddingConfig() {
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
    async loadActiveEmbeddingConfigFromRedis() {
        const transformers = await this.modelConfigCache.getActive(client_1.LlmModelKind.transformers_embedding);
        if (transformers === null || transformers === void 0 ? void 0 : transformers.enabled) {
            return transformers;
        }
        const api = await this.modelConfigCache.getActive(client_1.LlmModelKind.api_embedding);
        if (api === null || api === void 0 ? void 0 : api.enabled) {
            return api;
        }
        return null;
    }
    async getCachedConfig() {
        return this.getCachedChatConfig();
    }
    async loadActiveConfigFromDb(kind) {
        const config = await this.prisma.llmModelConfig.findFirst({
            where: { enabled: true, kind },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        });
        if (!config) {
            throw new common_1.NotFoundException(`no enabled llm model config found for kind=${kind}`);
        }
        return config;
    }
    async loadActiveEmbeddingConfigFromDb() {
        const transformers = await this.prisma.llmModelConfig.findFirst({
            where: {
                enabled: true,
                kind: client_1.LlmModelKind.transformers_embedding,
            },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        });
        if (transformers) {
            return transformers;
        }
        return this.prisma.llmModelConfig.findFirst({
            where: { enabled: true, kind: client_1.LlmModelKind.api_embedding },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        });
    }
    normalizeParameters(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
        }
        return value;
    }
    async embedTextsByLocalTransformer(texts, model, runtimeParams) {
        const runtime = await this.resolveLocalEmbeddingRuntime(model, runtimeParams);
        const vectors = [];
        for (let i = 0; i < texts.length; i += LlmService_1.LOCAL_EMBED_BATCH_SIZE) {
            const batch = texts.slice(i, i + LlmService_1.LOCAL_EMBED_BATCH_SIZE);
            const out = await runtime.extractor(batch, {
                pooling: 'mean',
                normalize: true,
            });
            const parsed = this.parseLocalEmbeddingOutput(out, batch.length);
            vectors.push(...parsed);
        }
        return vectors;
    }
    async resolveLocalEmbeddingRuntime(model, runtimeParams) {
        var _a, _b;
        const cacheKey = `${model}::${(_a = runtimeParams.localModelPath) !== null && _a !== void 0 ? _a : ''}::${runtimeParams.allowRemoteModels}`;
        if (((_b = this.localEmbeddingRuntime) === null || _b === void 0 ? void 0 : _b.model) === cacheKey) {
            return this.localEmbeddingRuntime;
        }
        const mod = (await Promise.resolve().then(() => require('@xenova/transformers')));
        let localModelPath = runtimeParams.localModelPath;
        let resolvedModel = model;
        const modelUrl = this.tryParseHttpUrl(model);
        if (modelUrl && !localModelPath) {
            const normalized = modelUrl.pathname.replace(/\/+$/, '');
            const slash = normalized.lastIndexOf('/');
            if (slash > 0) {
                const modelName = normalized.slice(slash + 1);
                const parentPath = normalized.slice(0, slash);
                if (modelName) {
                    resolvedModel = modelName;
                    localModelPath = `${modelUrl.origin}${parentPath}`;
                    this.logger.log(`embedding model URL detected, resolved model=${resolvedModel}, localModelPath=${localModelPath}`);
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
        this.logger.log(`local embedding model loaded: ${resolvedModel} allowRemote=${runtimeParams.allowRemoteModels}`);
        return this.localEmbeddingRuntime;
    }
    tryParseHttpUrl(value) {
        try {
            const parsed = new URL(value);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed;
            }
            return null;
        }
        catch (_a) {
            return null;
        }
    }
    parseLocalEmbeddingOutput(out, expected) {
        const maybeData = out;
        if ((maybeData === null || maybeData === void 0 ? void 0 : maybeData.data) && Array.isArray(maybeData.dims) && maybeData.dims.length === 2) {
            const rows = maybeData.dims[0];
            const cols = maybeData.dims[1];
            const raw = Array.from(maybeData.data);
            if (rows > 0 && cols > 0 && raw.length === rows * cols) {
                const vectors = [];
                for (let r = 0; r < rows; r += 1) {
                    vectors.push(raw.slice(r * cols, (r + 1) * cols));
                }
                return vectors.slice(0, expected);
            }
        }
        if (Array.isArray(out) &&
            out.every((row) => Array.isArray(row) && row.every((n) => typeof n === 'number'))) {
            return out.slice(0, expected);
        }
        const maybeToList = out;
        if (typeof (maybeToList === null || maybeToList === void 0 ? void 0 : maybeToList.tolist) === 'function') {
            const listed = maybeToList.tolist();
            if (Array.isArray(listed) &&
                listed.every((row) => Array.isArray(row) && row.every((n) => typeof n === 'number'))) {
                return listed.slice(0, expected);
            }
        }
        throw new Error('unable to parse local embedding output');
    }
    pickNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        return null;
    }
    resolveContextLength(parameters) {
        var _a, _b;
        return ((_b = (_a = this.pickNumber(parameters.contextLength)) !== null && _a !== void 0 ? _a : this.pickNumber(parameters.maxContextTokens)) !== null && _b !== void 0 ? _b : this.pickNumber(parameters.context_window));
    }
    normalizeConfiguredOutputMax(raw, contextLength) {
        if (raw <= 0) {
            return LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS;
        }
        if (contextLength == null) {
            if (raw > LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS) {
                this.logger.warn(`llm contextLength is missing; clamp maxTokens=${raw} to safe default ${LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS}`);
            }
            return Math.min(raw, LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS);
        }
        if (raw >= contextLength) {
            const capped = Math.min(LlmService_1.DEFAULT_OUTPUT_MAX_TOKENS, Math.max(512, Math.floor(contextLength / 4)));
            this.logger.warn(`llm maxTokens=${raw} is >= contextLength=${contextLength}; using output cap ${capped} instead`);
            return capped;
        }
        return raw;
    }
    capOutputMaxTokens(configuredOutput, contextLength, inputTokens) {
        if (contextLength == null) {
            return configuredOutput;
        }
        const available = contextLength -
            inputTokens -
            LlmService_1.INVOCATION_TOKEN_BUFFER;
        if (available < configuredOutput) {
            return Math.max(256, available);
        }
        return configuredOutput;
    }
    resolveLangChainBaseUrl(baseUrl, chatPath) {
        const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
        const normalizedPath = chatPath.trim();
        if (!normalizedPath) {
            return normalizedBase;
        }
        const withoutChatCompletions = normalizedPath.replace(/\/chat\/completions\/?$/i, '');
        if (!withoutChatCompletions || withoutChatCompletions === '/') {
            return normalizedBase;
        }
        const prefix = withoutChatCompletions.startsWith('/')
            ? withoutChatCompletions
            : `/${withoutChatCompletions}`;
        return `${normalizedBase}${prefix}`.replace(/\/+$/, '');
    }
    resolveOpenAiCompatibleUrl(baseUrl, chatPath, resourcePath) {
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
    parseEmbeddingResponse(payload, expectedCount) {
        var _a;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new Error('invalid embedding response');
        }
        const data = payload.data;
        if (!Array.isArray(data)) {
            throw new Error('embedding response missing data');
        }
        const rows = data
            .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                return null;
            }
            const row = item;
            const index = typeof row.index === 'number' && Number.isInteger(row.index)
                ? row.index
                : null;
            const embedding = row.embedding;
            if (!Array.isArray(embedding)) {
                return null;
            }
            const vector = embedding.filter((value) => typeof value === 'number' && Number.isFinite(value));
            if (vector.length === 0) {
                return null;
            }
            return { index, vector };
        })
            .filter((item) => item !== null);
        if (rows.length === 0) {
            throw new Error('embedding response has no vectors');
        }
        const ordered = new Array(expectedCount);
        for (const row of rows) {
            const slot = (_a = row.index) !== null && _a !== void 0 ? _a : ordered.findIndex((item) => item == null);
            if (slot >= 0 && slot < expectedCount) {
                ordered[slot] = row.vector;
            }
        }
        if (ordered.some((item) => !item)) {
            throw new Error('embedding response count mismatch');
        }
        return ordered;
    }
    toLangChainTools(tools) {
        return tools
            .map((tool) => {
            var _a, _b, _c;
            if (!((_a = tool === null || tool === void 0 ? void 0 : tool.function) === null || _a === void 0 ? void 0 : _a.name)) {
                return null;
            }
            return {
                type: 'function',
                function: {
                    name: tool.function.name,
                    description: (_b = tool.function.description) !== null && _b !== void 0 ? _b : '',
                    parameters: (_c = tool.function.parameters) !== null && _c !== void 0 ? _c : {
                        type: 'object',
                        properties: {},
                    },
                },
            };
        })
            .filter((item) => item !== null);
    }
    extractAiMessageReasoning(message) {
        const kwargs = message.additional_kwargs;
        if (!kwargs) {
            return '';
        }
        const reasoning = kwargs.reasoning_content;
        return typeof reasoning === 'string' ? reasoning : '';
    }
    extractAiMessageContent(content) {
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
            const row = item;
            const text = row.text;
            return typeof text === 'string' ? text : '';
        })
            .join('');
    }
    extractToolCalls(message) {
        var _a, _b, _c;
        const value = ((_c = (_a = message.tool_calls) !== null && _a !== void 0 ? _a : (_b = message.additional_kwargs) === null || _b === void 0 ? void 0 : _b.tool_calls) !== null && _c !== void 0 ? _c : []);
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                return null;
            }
            const row = item;
            if (typeof row.name === 'string') {
                return {
                    name: row.name,
                    arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(row.args),
                };
            }
            const fn = row.function;
            if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
                return null;
            }
            const fnRow = fn;
            if (typeof fnRow.name !== 'string') {
                return null;
            }
            return {
                name: fnRow.name,
                arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(fnRow.arguments),
            };
        })
            .filter((item) => item !== null);
    }
    extractModelName(responseMeta, fallback) {
        const modelName = responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta.model_name;
        if (typeof modelName === 'string' && modelName.trim()) {
            return modelName;
        }
        return fallback;
    }
};
LlmService.DEFAULT_OUTPUT_MAX_TOKENS = 2048;
LlmService.INVOCATION_TOKEN_BUFFER = 384;
LlmService.LOCAL_EMBED_BATCH_SIZE = 16;
LlmService = LlmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_model_config_cache_store_1.LlmModelConfigCacheStore,
        prompt_budget_service_1.PromptBudgetService,
        outbound_http_service_1.OutboundHttpService])
], LlmService);
exports.LlmService = LlmService;
//# sourceMappingURL=llm.service.js.map