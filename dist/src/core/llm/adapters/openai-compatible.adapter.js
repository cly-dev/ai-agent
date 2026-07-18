"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OpenAiCompatibleAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiCompatibleAdapter = void 0;
const common_1 = require("@nestjs/common");
let OpenAiCompatibleAdapter = OpenAiCompatibleAdapter_1 = class OpenAiCompatibleAdapter {
    constructor() {
        this.logger = new common_1.Logger(OpenAiCompatibleAdapter_1.name);
        this.streamReasoningOnlyChunks = 0;
        this.streamEmptyContentChunks = 0;
        this.streamContentChunks = 0;
    }
    async chat(request, config) {
        var _a, _b, _c;
        const endpoint = this.resolveEndpoint(config.baseUrl, config.chatPath);
        const apiKey = (_b = (_a = config.apiKey) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        const payload = this.buildPayload(request, false);
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new common_1.BadRequestException(`llm request failed: ${response.status} ${response.statusText} ${errorText}`);
            }
            const data = (await response.json());
            const { content, toolCalls } = this.extractMessage(data);
            if (!content && toolCalls.length === 0) {
                throw new common_1.InternalServerErrorException('llm response does not contain message content or tool_calls');
            }
            return {
                content,
                toolCalls,
                model: (_c = data.model) !== null && _c !== void 0 ? _c : request.model,
                raw: data,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`llm adapter request error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async streamChat(request, config, handlers) {
        var _a, _b, _c, _d, _e, _f, _g;
        const endpoint = this.resolveEndpoint(config.baseUrl, config.chatPath);
        const apiKey = (_b = (_a = config.apiKey) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        const payload = this.buildPayload(request, true);
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
        try {
            this.resetStreamProbe();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new common_1.BadRequestException(`llm stream request failed: ${response.status} ${response.statusText} ${errorText}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let content = '';
            const toolCalls = [];
            let model = request.model;
            let done = false;
            while (!done) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) {
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = (_c = lines.pop()) !== null && _c !== void 0 ? _c : '';
                for (const lineRaw of lines) {
                    const line = lineRaw.trim();
                    if (!line) {
                        continue;
                    }
                    const data = this.tryParseChunk(line);
                    if (!data) {
                        continue;
                    }
                    this.noteStreamChunk(data);
                    const extracted = this.extractMessage(data);
                    content += extracted.content;
                    for (const item of extracted.toolCalls) {
                        toolCalls.push(item);
                    }
                    model = (_d = data.model) !== null && _d !== void 0 ? _d : model;
                    done = data.done === true;
                    (_e = handlers === null || handlers === void 0 ? void 0 : handlers.onDelta) === null || _e === void 0 ? void 0 : _e.call(handlers, Object.assign(Object.assign({ model, contentDelta: extracted.content }, (extracted.reasoning
                        ? { reasoningDelta: extracted.reasoning }
                        : {})), { toolCalls: extracted.toolCalls, done, raw: data }));
                }
            }
            if (buffer.trim()) {
                const data = this.tryParseChunk(buffer.trim());
                if (data) {
                    this.noteStreamChunk(data);
                    const extracted = this.extractMessage(data);
                    content += extracted.content;
                    for (const item of extracted.toolCalls) {
                        toolCalls.push(item);
                    }
                    model = (_f = data.model) !== null && _f !== void 0 ? _f : model;
                    done = done || data.done === true;
                    (_g = handlers === null || handlers === void 0 ? void 0 : handlers.onDelta) === null || _g === void 0 ? void 0 : _g.call(handlers, Object.assign(Object.assign({ model, contentDelta: extracted.content }, (extracted.reasoning
                        ? { reasoningDelta: extracted.reasoning }
                        : {})), { toolCalls: extracted.toolCalls, done, raw: data }));
                }
            }
            if (!content && toolCalls.length === 0) {
                this.logStreamProbeSummary('stream-empty-result');
                return this.chat(Object.assign(Object.assign({}, request), { stream: false }), config);
            }
            this.logStreamProbeSummary('stream-complete');
            return {
                content,
                toolCalls,
                model,
                raw: { done },
            };
        }
        catch (error) {
            this.logStreamProbeSummary('stream-error');
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`llm adapter stream error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    resolveEndpoint(baseUrl, chatPath) {
        const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
        const path = chatPath.trim();
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${normalizedBase}${normalizedPath}`;
    }
    resetStreamProbe() {
        this.streamReasoningOnlyChunks = 0;
        this.streamEmptyContentChunks = 0;
        this.streamContentChunks = 0;
    }
    logStreamProbeSummary(phase) {
        if (this.streamReasoningOnlyChunks === 0 &&
            this.streamEmptyContentChunks === 0 &&
            this.streamContentChunks === 0) {
            return;
        }
        const line = `[OpenAiCompatibleAdapter] ${phase}` +
            ` contentChunks=${this.streamContentChunks}` +
            ` reasoningOnlyChunks=${this.streamReasoningOnlyChunks}` +
            ` emptyChunks=${this.streamEmptyContentChunks}`;
        if (this.streamReasoningOnlyChunks > 0 && this.streamContentChunks === 0) {
            this.logger.warn(`${line} → model may be emitting reasoning_content only; check Qwen3 thinking config`);
            return;
        }
        this.logger.log(line);
    }
    extractContent(data) {
        var _a, _b, _c, _d, _e, _f;
        const choice = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0];
        const text = (_e = (_c = (_b = data.message) === null || _b === void 0 ? void 0 : _b.content) !== null && _c !== void 0 ? _c : (_d = choice === null || choice === void 0 ? void 0 : choice.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : (_f = choice === null || choice === void 0 ? void 0 : choice.delta) === null || _f === void 0 ? void 0 : _f.content;
        return typeof text === 'string' ? text : '';
    }
    extractReasoning(data) {
        var _a, _b, _c, _d;
        const choice = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0];
        const reasoning = (_c = (_b = choice === null || choice === void 0 ? void 0 : choice.delta) === null || _b === void 0 ? void 0 : _b.reasoning_content) !== null && _c !== void 0 ? _c : (_d = choice === null || choice === void 0 ? void 0 : choice.message) === null || _d === void 0 ? void 0 : _d.reasoning_content;
        return typeof reasoning === 'string' ? reasoning : '';
    }
    noteStreamChunk(data) {
        var _a, _b, _c, _d, _e, _f, _g;
        const choice = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0];
        const content = (_c = (_b = choice === null || choice === void 0 ? void 0 : choice.delta) === null || _b === void 0 ? void 0 : _b.content) !== null && _c !== void 0 ? _c : (_d = choice === null || choice === void 0 ? void 0 : choice.message) === null || _d === void 0 ? void 0 : _d.content;
        const reasoning = (_f = (_e = choice === null || choice === void 0 ? void 0 : choice.delta) === null || _e === void 0 ? void 0 : _e.reasoning_content) !== null && _f !== void 0 ? _f : (_g = choice === null || choice === void 0 ? void 0 : choice.message) === null || _g === void 0 ? void 0 : _g.reasoning_content;
        const hasContent = typeof content === 'string' && content.length > 0;
        const hasReasoning = typeof reasoning === 'string' && reasoning.length > 0;
        if (hasContent) {
            this.streamContentChunks += 1;
            return;
        }
        if (hasReasoning) {
            this.streamReasoningOnlyChunks += 1;
            return;
        }
        this.streamEmptyContentChunks += 1;
    }
    extractToolCalls(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const toolCalls = (_k = (_f = (_b = (_a = data.message) === null || _a === void 0 ? void 0 : _a.tool_calls) !== null && _b !== void 0 ? _b : (_e = (_d = (_c = data.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.tool_calls) !== null && _f !== void 0 ? _f : (_j = (_h = (_g = data.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.delta) === null || _j === void 0 ? void 0 : _j.tool_calls) !== null && _k !== void 0 ? _k : [];
        return toolCalls
            .map((item) => {
            var _a, _b;
            const name = (_a = item.function) === null || _a === void 0 ? void 0 : _a.name;
            if (!name) {
                return null;
            }
            return {
                name,
                arguments: this.normalizeArguments((_b = item.function) === null || _b === void 0 ? void 0 : _b.arguments),
            };
        })
            .filter((item) => item !== null);
    }
    extractMessage(data) {
        return {
            content: this.extractContent(data),
            reasoning: this.extractReasoning(data),
            toolCalls: this.extractToolCalls(data),
        };
    }
    buildPayload(request, forceStream) {
        var _a, _b, _c, _d, _e;
        return {
            model: request.model,
            messages: request.messages,
            stream: forceStream ? true : (_a = request.stream) !== null && _a !== void 0 ? _a : false,
            tools: (_b = request.tools) !== null && _b !== void 0 ? _b : [],
            parameters: (_c = request.parameters) !== null && _c !== void 0 ? _c : {},
            max_tokens: (_d = request.maxTokens) !== null && _d !== void 0 ? _d : undefined,
            temperature: (_e = request.temperature) !== null && _e !== void 0 ? _e : undefined,
        };
    }
    tryParseChunk(value) {
        const line = value.trim();
        if (!line) {
            return null;
        }
        if (line === '[DONE]') {
            return { done: true };
        }
        const normalized = line.startsWith('data:') ? line.slice(5).trim() : line;
        if (!normalized || normalized === '[DONE]') {
            return { done: true };
        }
        try {
            return JSON.parse(normalized);
        }
        catch (_a) {
            return null;
        }
    }
    normalizeArguments(value) {
        if (!value) {
            return {};
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            }
            catch (_a) {
                return {};
            }
        }
        return {};
    }
};
OpenAiCompatibleAdapter = OpenAiCompatibleAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], OpenAiCompatibleAdapter);
exports.OpenAiCompatibleAdapter = OpenAiCompatibleAdapter;
//# sourceMappingURL=openai-compatible.adapter.js.map