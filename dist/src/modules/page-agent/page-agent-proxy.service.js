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
var PageAgentProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageAgentProxyService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const llm_service_1 = require("../../core/llm/llm.service");
const outbound_http_service_1 = require("../../core/outbound-http/outbound-http.service");
const outbound_http_policy_util_1 = require("../../core/outbound-http/outbound-http.policy.util");
const outbound_http_types_1 = require("../../core/outbound-http/outbound-http.types");
const page_action_run_audit_util_1 = require("../../core/page-action/page-action-run-audit.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const page_agent_mapper_1 = require("./page-agent.mapper");
const page_agent_types_1 = require("./page-agent.types");
const ERROR_PREVIEW_MAX_CHARS = 2000;
let PageAgentProxyService = PageAgentProxyService_1 = class PageAgentProxyService {
    constructor(prisma, llmService, outboundHttp) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.outboundHttp = outboundHttp;
        this.logger = new common_1.Logger(PageAgentProxyService_1.name);
    }
    async proxyChatCompletions(input) {
        const body = this.assertRequestBody(input.body);
        const config = await this.llmService.getActiveChatModelConfig();
        const payload = this.buildUpstreamPayload(body, config);
        const timeoutMs = this.readTimeoutMs();
        const startedAt = Date.now();
        const audit = await this.prisma.pageAgentLlmProxyAudit.create({
            data: {
                appClientId: input.appClientId,
                userId: input.userId,
                modelConfigId: config.id,
                requestedModel: this.pickString(body.model),
                provider: config.provider,
                providerModel: config.model,
                requestMeta: this.buildRequestMeta(body, payload),
            },
        });
        const abortController = new AbortController();
        let timedOut = false;
        let clientClosed = false;
        const onClientClose = () => {
            if (!input.res.writableEnded) {
                clientClosed = true;
                abortController.abort();
            }
        };
        input.res.on('close', onClientClose);
        try {
            const upstream = await this.outboundHttp.fetchWithPolicy(this.resolveEndpoint(config), {
                method: 'POST',
                headers: this.buildHeaders(config),
                body: JSON.stringify(payload),
            }, {
                timeoutMs,
                signal: abortController.signal,
                label: 'page_agent_proxy',
                ssrf: false,
            });
            await this.writeUpstreamResponse(input.res, upstream, audit.id, startedAt);
        }
        catch (error) {
            timedOut =
                error instanceof outbound_http_types_1.OutboundHttpError && error.kind === 'timeout';
            const message = this.errorMessage(error, timedOut, clientClosed);
            await this.updateAuditFailed(audit.id, startedAt, message);
            if (input.res.headersSent) {
                if (!input.res.writableEnded) {
                    input.res.end();
                }
                return;
            }
            if (timedOut) {
                throw new common_1.RequestTimeoutException('page-agent proxy upstream timeout');
            }
            if (clientClosed) {
                throw new common_1.BadGatewayException('page-agent client connection closed');
            }
            throw new common_1.BadGatewayException(`page-agent proxy failed: ${message}`);
        }
        finally {
            input.res.off('close', onClientClose);
        }
    }
    async findAuditPage(appClientId, query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({ appClientId }, (query.userId != null ? { userId: query.userId } : {})), (query.status ? { status: query.status } : {})), (query.modelConfigId != null
            ? { modelConfigId: query.modelConfigId }
            : {})), (query.upstreamStatus != null
            ? { upstreamStatus: query.upstreamStatus }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.pageAgentLlmProxyAudit.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: page_agent_types_1.PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE,
            }),
            this.prisma.pageAgentLlmProxyAudit.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(page_agent_mapper_1.toPageAgentLlmProxyAuditListItem), total, page, pageSize);
    }
    async findAuditDetail(appClientId, id) {
        const row = await this.prisma.pageAgentLlmProxyAudit.findFirst({
            where: { id, appClientId },
            include: page_agent_types_1.PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`PageAgent audit ${id} not found`);
        }
        return (0, page_agent_mapper_1.toPageAgentLlmProxyAuditDetail)(row);
    }
    async writeUpstreamResponse(res, upstream, auditId, startedAt) {
        const state = {
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            providerModel: null,
            errorPreview: '',
        };
        const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
        res.status(upstream.status);
        res.setHeader('content-type', contentType);
        this.copyHeader(upstream, res, 'cache-control');
        this.copyHeader(upstream, res, 'x-request-id');
        try {
            const body = Buffer.from(await upstream.arrayBuffer());
            this.observeBufferedBody(body, contentType, state, upstream.ok);
            if (!res.writableEnded) {
                res.send(body);
            }
            await this.updateAuditFinished(auditId, startedAt, upstream.status, state);
        }
        catch (error) {
            if (!res.writableEnded) {
                res.end();
            }
            throw error;
        }
    }
    observeBufferedBody(body, contentType, state, upstreamOk) {
        const text = body.toString('utf8');
        const parsed = this.tryParseJsonBody(text, contentType);
        if (parsed) {
            this.mergeProviderModel(state, parsed);
            this.mergeUsage(state, parsed);
            if (!upstreamOk) {
                state.errorPreview = this.extractErrorPreview(parsed, text);
            }
            return;
        }
        if (!upstreamOk) {
            state.errorPreview = text.slice(0, ERROR_PREVIEW_MAX_CHARS);
        }
    }
    tryParseJsonBody(text, contentType) {
        const trimmed = text.trim();
        if (!contentType.toLowerCase().includes('json') &&
            !trimmed.startsWith('{')) {
            return null;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (_a) {
            return null;
        }
        return null;
    }
    extractErrorPreview(data, fallback) {
        const error = data.error;
        if (typeof error === 'string' && error.trim()) {
            return error.slice(0, ERROR_PREVIEW_MAX_CHARS);
        }
        if (error && typeof error === 'object' && !Array.isArray(error)) {
            const message = error.message;
            if (typeof message === 'string' && message.trim()) {
                return message.slice(0, ERROR_PREVIEW_MAX_CHARS);
            }
        }
        return fallback.slice(0, ERROR_PREVIEW_MAX_CHARS);
    }
    copyHeader(upstream, res, header) {
        const value = upstream.headers.get(header);
        if (value) {
            res.setHeader(header, value);
        }
    }
    mergeProviderModel(state, data) {
        if (typeof data.model === 'string' && data.model.trim()) {
            state.providerModel = data.model;
        }
    }
    mergeUsage(state, data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const raw = (_b = (_a = data.usage) !== null && _a !== void 0 ? _a : data.token_usage) !== null && _b !== void 0 ? _b : data.tokenUsage;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return;
        }
        const row = raw;
        const prompt = (_d = (_c = this.pickInt(row.prompt_tokens)) !== null && _c !== void 0 ? _c : this.pickInt(row.input_tokens)) !== null && _d !== void 0 ? _d : this.pickInt(row.promptTokens);
        const completion = (_f = (_e = this.pickInt(row.completion_tokens)) !== null && _e !== void 0 ? _e : this.pickInt(row.output_tokens)) !== null && _f !== void 0 ? _f : this.pickInt(row.completionTokens);
        const total = (_h = (_g = this.pickInt(row.total_tokens)) !== null && _g !== void 0 ? _g : this.pickInt(row.totalTokens)) !== null && _h !== void 0 ? _h : (prompt != null || completion != null
            ? (prompt !== null && prompt !== void 0 ? prompt : 0) + (completion !== null && completion !== void 0 ? completion : 0)
            : null);
        state.promptTokens = prompt !== null && prompt !== void 0 ? prompt : state.promptTokens;
        state.completionTokens = completion !== null && completion !== void 0 ? completion : state.completionTokens;
        state.totalTokens = total !== null && total !== void 0 ? total : state.totalTokens;
    }
    async updateAuditFinished(auditId, startedAt, upstreamStatus, state) {
        const success = upstreamStatus >= 200 && upstreamStatus < 300;
        await this.safeUpdateAudit(auditId, {
            status: success ? 'success' : 'failed',
            upstreamStatus,
            providerModel: state.providerModel,
            promptTokens: state.promptTokens,
            completionTokens: state.completionTokens,
            totalTokens: state.totalTokens,
            durationMs: Date.now() - startedAt,
            finishedAt: new Date(),
            errorMessage: success ? null : state.errorPreview || `upstream ${upstreamStatus}`,
        });
    }
    async updateAuditFailed(auditId, startedAt, errorMessage) {
        await this.safeUpdateAudit(auditId, {
            status: 'failed',
            durationMs: Date.now() - startedAt,
            finishedAt: new Date(),
            errorMessage,
        });
    }
    async safeUpdateAudit(auditId, data) {
        try {
            await this.prisma.pageAgentLlmProxyAudit.update({
                where: { id: auditId },
                data,
            });
        }
        catch (error) {
            this.logger.warn(`failed to update page-agent proxy audit ${auditId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    buildHeaders(config) {
        const apiKey = this.resolveApiKey(config);
        return {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
        };
    }
    resolveApiKey(config) {
        var _a, _b;
        const fromDb = config.apiKey != null ? String(config.apiKey).trim() : '';
        const fromEnv = (_b = (_a = process.env.OPENAI_API_KEY) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        return fromDb || fromEnv || 'local-internal';
    }
    resolveEndpoint(config) {
        const base = config.baseUrl.trim().replace(/\/+$/, '');
        const path = config.chatPath.trim();
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${normalizedPath}`;
    }
    buildUpstreamPayload(body, config) {
        const payload = Object.assign(Object.assign({}, body), { model: config.model, stream: false });
        delete payload.stream_options;
        if (payload.temperature == null && config.temperature != null) {
            payload.temperature = config.temperature;
        }
        if (payload.max_tokens == null &&
            payload.maxTokens == null &&
            config.maxTokens != null) {
            payload.max_tokens = config.maxTokens;
        }
        return payload;
    }
    buildRequestMeta(body, payload) {
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const tools = Array.isArray(body.tools) ? body.tools : [];
        return (0, page_action_run_audit_util_1.summarizeRecordForAudit)({
            bodyKeys: Object.keys(body),
            messageCount: messages.length,
            toolCount: tools.length,
            requestedStream: body.stream,
            forcedStream: payload.stream,
            requestedModel: body.model,
            toolChoice: body.tool_choice,
            hasStreamOptions: body.stream_options != null,
        });
    }
    assertRequestBody(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new common_1.BadRequestException('OpenAI-compatible request body is required');
        }
        const row = body;
        if (!Array.isArray(row.messages)) {
            throw new common_1.BadRequestException('messages must be an array');
        }
        return row;
    }
    readTimeoutMs() {
        return (0, outbound_http_policy_util_1.readPageAgentProxyTimeoutMs)();
    }
    pickString(value) {
        return typeof value === 'string' && value.trim() ? value : null;
    }
    pickInt(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return Math.max(0, Math.floor(value));
        }
        return null;
    }
    errorMessage(error, timedOut, clientClosed) {
        if (timedOut) {
            return 'upstream timeout';
        }
        if (clientClosed) {
            return 'client connection closed';
        }
        return error instanceof Error ? error.message : String(error);
    }
};
PageAgentProxyService = PageAgentProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService,
        outbound_http_service_1.OutboundHttpService])
], PageAgentProxyService);
exports.PageAgentProxyService = PageAgentProxyService;
//# sourceMappingURL=page-agent-proxy.service.js.map