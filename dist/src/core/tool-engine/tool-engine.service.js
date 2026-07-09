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
var ToolEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolEngineService = void 0;
const fs = require("node:fs");
const path = require("node:path");
const common_1 = require("@nestjs/common");
const tools_1 = require("@langchain/core/tools");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const outbound_http_service_1 = require("../outbound-http/outbound-http.service");
const outbound_http_policy_util_1 = require("../outbound-http/outbound-http.policy.util");
const outbound_http_types_1 = require("../outbound-http/outbound-http.types");
const outbound_url_guard_util_1 = require("../security/outbound-url-guard.util");
const file_debug_log_util_1 = require("../security/file-debug-log.util");
const tool_input_sanitize_util_1 = require("./tool-input-sanitize.util");
const tool_response_source_util_1 = require("./tool-response-source.util");
const tool_schema_util_1 = require("./tool-schema.util");
const integration_credential_resolver_util_1 = require("./integration-credential-resolver.util");
let ToolEngineService = ToolEngineService_1 = class ToolEngineService {
    constructor(prisma, outboundHttp) {
        this.prisma = prisma;
        this.outboundHttp = outboundHttp;
        this.logger = new common_1.Logger(ToolEngineService_1.name);
    }
    buildLangChainTools(definitions, ctx) {
        const allowedIds = new Set(ctx.allowedToolIds);
        const tools = [];
        const byName = new Map();
        for (const def of definitions) {
            if (!allowedIds.has(def.id)) {
                continue;
            }
            const parameters = (0, tool_schema_util_1.resolveToolZodSchema)(def.inputSchema, def.schema);
            const lcTool = (0, tools_1.tool)(async (input) => this.executeFromDefinition(def, input, ctx.userId, {
                integrationCredentialCache: ctx.integrationCredentialCache,
            }), {
                name: def.name,
                description: def.description,
                schema: parameters,
            });
            tools.push(lcTool);
            byName.set(def.name, lcTool);
        }
        return { tools, byName };
    }
    async invokeLangChainTool(bundle, toolName, input) {
        const lcTool = bundle.byName.get(toolName);
        if (!lcTool) {
            throw new common_1.NotFoundException(`tool ${toolName} not found in bound tools`);
        }
        return lcTool.invoke(input);
    }
    async debugExecute(toolId, options = {}) {
        var _a, _b, _c, _d;
        const tool = await this.prisma.tool.findUnique({
            where: { id: toolId },
            include: { integration: true },
        });
        if (!tool) {
            throw new common_1.NotFoundException(`tool ${toolId} not found`);
        }
        let specs = this.loadOpenApiParameterSpecs(tool.inputSchema, tool.schema);
        let input = (0, tool_input_sanitize_util_1.applyToolParameterDefaults)((_a = options.parameters) !== null && _a !== void 0 ? _a : {}, specs, {
            agentMetadata: tool.agentMetadata,
            responseProfile: tool.responseProfile,
        });
        input = (0, tool_input_sanitize_util_1.sanitizeToolInvokeInput)(input, specs);
        const apiKey = ((_b = options.apiKey) === null || _b === void 0 ? void 0 : _b.trim()) || ((_c = tool.integration.apiKey) === null || _c === void 0 ? void 0 : _c.trim()) || '';
        const headers = this.buildBaseHeaders(apiKey);
        this.applyHeaderParameters(headers, specs, input);
        if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                if (value === undefined || value === null) {
                    continue;
                }
                headers[key] = String(value);
            }
        }
        const resolvedPath = this.applyPathPlaceholders(tool.path, input);
        const url = this.resolveUrl(tool.integration.baseUrl, resolvedPath, tool.method, input, specs);
        (0, outbound_url_guard_util_1.assertOutboundUrlAllowed)(url);
        const bodyPayload = this.buildJsonBody(tool.method, input, specs, tool.path);
        const httpMethod = this.toHttpMethod(tool.method);
        const startedAt = Date.now();
        const timeoutMs = this.resolveTimeoutMs((_d = options.timeoutMs) !== null && _d !== void 0 ? _d : tool.timeout, tool.name);
        const baseResult = {
            toolId: tool.id,
            toolName: tool.name,
            method: httpMethod,
            url,
            request: {
                headers: this.redactHeaders(headers),
                body: bodyPayload !== null && bodyPayload !== void 0 ? bodyPayload : null,
            },
        };
        try {
            const response = await this.outboundHttp.fetchWithPolicy(url, {
                method: httpMethod,
                headers,
                body: bodyPayload,
            }, {
                timeoutMs,
                label: 'tool_debug',
            });
            const bodyText = await response.text();
            const data = this.safeJsonParse(bodyText);
            return Object.assign(Object.assign({}, baseResult), { ok: response.ok, durationMs: Date.now() - startedAt, response: {
                    status: response.status,
                    statusText: response.statusText,
                    body: bodyText,
                    data,
                }, error: response.ok
                    ? undefined
                    : `HTTP ${response.status} ${response.statusText}` });
        }
        catch (error) {
            return Object.assign(Object.assign({}, baseResult), { ok: false, durationMs: Date.now() - startedAt, error: this.formatOutboundFetchError(error, timeoutMs) });
        }
    }
    async executeByName(toolName, input, allowedToolIds, userId, options) {
        var _a;
        const def = (_a = options === null || options === void 0 ? void 0 : options.preloadedDefinition) !== null && _a !== void 0 ? _a : (await this.loadToolDefinitionByName(toolName, allowedToolIds));
        if (!def) {
            this.writeToolDebugSnapshot({
                phase: 'tool_not_found',
                at: new Date().toISOString(),
                toolNameRequested: toolName,
                allowedToolIds,
                input,
            });
            throw new common_1.NotFoundException(`tool ${toolName} not found or not allowed`);
        }
        return this.executeFromDefinition(def, input, userId, {
            integrationCredentialCache: options === null || options === void 0 ? void 0 : options.integrationCredentialCache,
        });
    }
    async loadToolDefinitionByName(toolName, allowedToolIds) {
        const tool = await this.prisma.tool.findFirst({
            where: {
                name: toolName,
                id: { in: allowedToolIds },
                isActive: true,
            },
            include: {
                integration: true,
            },
        });
        if (!tool) {
            return null;
        }
        return {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            schema: tool.schema,
            method: tool.method,
            path: tool.path,
            timeout: tool.timeout,
            integration: {
                id: tool.integration.id,
                name: tool.integration.name,
                baseUrl: tool.integration.baseUrl,
                authMode: tool.integration.authMode,
                apiKey: tool.integration.apiKey,
            },
            agentMetadata: tool.agentMetadata,
            responseProfile: tool.responseProfile,
        };
    }
    async executeFromDefinition(def, input, userId, options) {
        var _a, _b, _c, _d, _e;
        const startedAt = Date.now();
        const timeoutMs = this.resolveTimeoutMs(def.timeout, def.name);
        try {
            const specs = this.loadOpenApiParameterSpecs(def.inputSchema, def.schema);
            input = (0, tool_input_sanitize_util_1.applyToolParameterDefaults)(input, specs, {
                agentMetadata: def.agentMetadata,
                responseProfile: def.responseProfile,
            });
            input = (0, tool_input_sanitize_util_1.sanitizeToolInvokeInput)(input, specs);
            const credentialCacheKey = (0, integration_credential_resolver_util_1.integrationCredentialCacheKey)(userId, def.integration.id);
            const cachedUserApiKey = (_a = options === null || options === void 0 ? void 0 : options.integrationCredentialCache) === null || _a === void 0 ? void 0 : _a.get(credentialCacheKey);
            let userApiKey = '';
            if (cachedUserApiKey !== undefined) {
                userApiKey = cachedUserApiKey;
            }
            else {
                const userIntegration = await this.prisma.userIntegration.findUnique({
                    where: {
                        userId_integrationId: {
                            userId,
                            integrationId: def.integration.id,
                        },
                    },
                    select: {
                        userApiKey: true,
                        isActive: true,
                    },
                });
                userApiKey =
                    (userIntegration === null || userIntegration === void 0 ? void 0 : userIntegration.isActive) === true
                        ? (_c = (_b = userIntegration.userApiKey) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : ''
                        : '';
            }
            const authMode = def.integration.authMode;
            const systemApiKey = authMode === client_1.IntegrationAuthMode.SYSTEM_ONLY ||
                authMode === client_1.IntegrationAuthMode.USER_PREFERRED
                ? (_e = (_d = def.integration.apiKey) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : ''
                : '';
            const { apiKey: selectedApiKey, source: authSource } = this.resolveAuthCredential(authMode, userApiKey, systemApiKey);
            if (!selectedApiKey) {
                throw new common_1.BadRequestException(`integration ${def.integration.name} auth unresolved (mode=${authMode})`);
            }
            const headers = this.buildBaseHeaders(selectedApiKey);
            this.applyHeaderParameters(headers, specs, input);
            const resolvedPath = this.applyPathPlaceholders(def.path, input);
            const url = this.resolveUrl(def.integration.baseUrl, resolvedPath, def.method, input, specs);
            (0, outbound_url_guard_util_1.assertOutboundUrlAllowed)(url);
            const bodyPayload = this.buildJsonBody(def.method, input, specs, def.path);
            const httpMethod = this.toHttpMethod(def.method);
            const response = await this.outboundHttp.fetchWithPolicy(url, {
                method: httpMethod,
                headers,
                body: bodyPayload,
            }, {
                timeoutMs,
                label: `tool_invoke:${def.name}`,
            });
            const bodyText = await response.text();
            const output = this.safeJsonParse(bodyText);
            const httpResponse = (0, tool_response_source_util_1.buildHttpResponseSource)(response, bodyText, output);
            this.writeToolDebugSnapshot({
                phase: 'after_fetch',
                at: new Date().toISOString(),
                toolNameRequested: def.name,
                input,
                tool: {
                    id: def.id,
                    name: def.name,
                    method: def.method,
                    pathTemplate: def.path,
                    resolvedPath,
                    timeoutMs,
                    isActive: true,
                },
                openApiParameterSpecs: specs,
                integration: {
                    id: def.integration.id,
                    name: def.integration.name,
                    baseUrl: def.integration.baseUrl,
                    authMode: def.integration.authMode,
                    authSource,
                    userApiKey: this.redactSecret(userApiKey),
                    systemApiKey: this.redactSecret(systemApiKey),
                },
                request: {
                    url,
                    method: httpMethod,
                    headers: this.redactHeaders(headers),
                    body: bodyPayload !== null && bodyPayload !== void 0 ? bodyPayload : null,
                },
                response: {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    bodyLength: bodyText.length,
                    bodyPreview: bodyText.slice(0, 8000),
                },
                latencyMs: Date.now() - startedAt,
            });
            if (!response.ok) {
                const apiKey = selectedApiKey === null || selectedApiKey === void 0 ? void 0 : selectedApiKey.trim();
                const authHint = response.status === 401
                    ? apiKey
                        ? ` downstream returned 401: verify ${authSource} api key, or confirm the API expects Bearer (not x-api-key / Basic).`
                        : ' downstream returned 401: auth key is empty — set a valid key, or configure the upstream to accept unauthenticated requests.'
                    : '';
                throw new tool_response_source_util_1.ToolHttpResponseError(`tool ${def.name} failed: ${response.status} ${response.statusText}.${authHint}`, httpResponse);
            }
            return {
                toolId: def.id,
                name: def.name,
                input,
                output,
                latency: Date.now() - startedAt,
                responseSource: bodyText,
                httpResponse,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException ||
                error instanceof tool_response_source_util_1.ToolHttpResponseError ||
                error instanceof outbound_http_types_1.OutboundHttpError) {
                throw error;
            }
            throw new Error(`tool ${def.name} invoke failed: ${this.formatOutboundFetchError(error, timeoutMs)}`);
        }
    }
    buildBaseHeaders(apiKeyRaw) {
        const headers = {
            'Content-Type': 'application/json',
        };
        const apiKey = apiKeyRaw === null || apiKeyRaw === void 0 ? void 0 : apiKeyRaw.trim();
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
        return headers;
    }
    resolveAuthCredential(mode, userApiKey, systemApiKey) {
        if (mode === client_1.IntegrationAuthMode.USER_ONLY) {
            return userApiKey
                ? { apiKey: userApiKey, source: 'user' }
                : { apiKey: '', source: 'none' };
        }
        if (mode === client_1.IntegrationAuthMode.SYSTEM_ONLY) {
            return systemApiKey
                ? { apiKey: systemApiKey, source: 'system' }
                : { apiKey: '', source: 'none' };
        }
        if (userApiKey) {
            return { apiKey: userApiKey, source: 'user' };
        }
        if (systemApiKey) {
            return { apiKey: systemApiKey, source: 'system' };
        }
        return { apiKey: '', source: 'none' };
    }
    applyHeaderParameters(headers, specs, input) {
        for (const spec of specs) {
            if (spec.in !== 'header') {
                continue;
            }
            const value = input[spec.name];
            if (value === undefined || value === null) {
                continue;
            }
            headers[spec.name] = (0, tool_input_sanitize_util_1.formatQueryScalar)(value);
        }
    }
    loadOpenApiParameterSpecs(inputSchema, fallbackSchema) {
        let specs = (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(inputSchema);
        if (specs.length === 0) {
            specs = (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(fallbackSchema);
        }
        return specs;
    }
    applyPathPlaceholders(path, input) {
        return path.replace(/\{([^/{}]+)\}/g, (_m, rawName) => {
            const key = typeof rawName === 'string' ? rawName.trim() : String(rawName);
            const value = input[key];
            if (value === undefined || value === null) {
                return `{${key}}`;
            }
            return encodeURIComponent((0, tool_input_sanitize_util_1.formatQueryScalar)(value));
        });
    }
    reservedBodyKeys(specs, pathTemplate) {
        const reserved = new Set();
        const re = /\{([^/{}]+)\}/g;
        let m = re.exec(pathTemplate);
        while (m !== null) {
            reserved.add(m[1].trim());
            m = re.exec(pathTemplate);
        }
        for (const s of specs) {
            if (s.in === 'header' || s.in === 'query' || s.in === 'path') {
                reserved.add(s.name);
            }
        }
        return reserved;
    }
    resolveUrl(baseUrl, path, method, input, specs) {
        const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = new URL(`${normalizedBase}${normalizedPath}`);
        if (method !== client_1.HttpMethod.Get) {
            return url.toString();
        }
        if (specs.length === 0) {
            for (const [key, value] of Object.entries(input)) {
                this.appendQueryParam(url, key, value);
            }
            return url.toString();
        }
        const querySpecs = specs.filter((s) => s.in === 'query');
        for (const spec of querySpecs) {
            this.appendQueryParam(url, spec.name, input[spec.name], spec);
        }
        return url.toString();
    }
    appendQueryParam(url, name, value, spec) {
        if (value === undefined || value === null) {
            return;
        }
        const useMulti = (spec === null || spec === void 0 ? void 0 : spec.collectionFormat) === 'multi' || (spec === null || spec === void 0 ? void 0 : spec.type) === 'array';
        if (useMulti && Array.isArray(value)) {
            for (const item of value) {
                if (item === undefined || item === null) {
                    continue;
                }
                url.searchParams.append(name, (0, tool_input_sanitize_util_1.formatQueryScalar)(item));
            }
            return;
        }
        if (Array.isArray(value)) {
            url.searchParams.set(name, value.map((item) => (0, tool_input_sanitize_util_1.formatQueryScalar)(item)).join(','));
            return;
        }
        url.searchParams.set(name, (0, tool_input_sanitize_util_1.formatQueryScalar)(value));
    }
    buildJsonBody(method, input, specs, pathTemplate) {
        if (method === client_1.HttpMethod.Get) {
            return undefined;
        }
        if (specs.length === 0) {
            return JSON.stringify(input);
        }
        const reserved = this.reservedBodyKeys(specs, pathTemplate);
        const body = {};
        for (const [key, value] of Object.entries(input)) {
            if (reserved.has(key)) {
                continue;
            }
            body[key] = value;
        }
        return JSON.stringify(body, (_key, value) => value === undefined ? undefined : value);
    }
    toHttpMethod(method) {
        switch (method) {
            case client_1.HttpMethod.Get:
                return 'GET';
            case client_1.HttpMethod.Post:
                return 'POST';
            case client_1.HttpMethod.Put:
                return 'PUT';
            case client_1.HttpMethod.Delete:
                return 'DELETE';
            default:
                return 'POST';
        }
    }
    safeJsonParse(value) {
        try {
            return JSON.parse(value);
        }
        catch (_a) {
            return value;
        }
    }
    resolveTimeoutMs(configured, toolName) {
        const fallback = (0, outbound_http_policy_util_1.readToolDefaultTimeoutMs)();
        if (typeof configured !== 'number' || !Number.isFinite(configured)) {
            return fallback;
        }
        const rounded = Math.floor(configured);
        if (rounded < 1) {
            return fallback;
        }
        if (rounded > ToolEngineService_1.MAX_TIMEOUT_MS) {
            this.logger.warn(`tool ${toolName} timeout ${rounded} exceeds setTimeout max; clamped to ${ToolEngineService_1.MAX_TIMEOUT_MS}`);
            return ToolEngineService_1.MAX_TIMEOUT_MS;
        }
        return rounded;
    }
    formatOutboundFetchError(error, timeoutMs) {
        if (error instanceof outbound_http_types_1.OutboundHttpError) {
            if (error.kind === 'timeout') {
                return `request timed out after ${timeoutMs}ms`;
            }
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    writeToolDebugSnapshot(record) {
        var _a, _b, _c, _d;
        if (!(0, file_debug_log_util_1.isToolEngineFileDebugEnabled)()) {
            return;
        }
        const toolName = String((_c = (_a = record.toolNameRequested) !== null && _a !== void 0 ? _a : (_b = record.tool) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'tool');
        const phase = String((_d = record.phase) !== null && _d !== void 0 ? _d : 'debug');
        const latencyMs = typeof record.latencyMs === 'number' ? record.latencyMs : null;
        const response = record.response;
        const status = (response === null || response === void 0 ? void 0 : response.status) != null
            ? String(response.status)
            : (response === null || response === void 0 ? void 0 : response.ok) === false
                ? 'error'
                : '-';
        this.logger.log(`tool HTTP tool=${toolName} phase=${phase} status=${status}${latencyMs != null ? ` latencyMs=${latencyMs}` : ''}`);
        try {
            const dir = path.join(process.cwd(), 'logs', 'tool-engine');
            fs.mkdirSync(dir, { recursive: true });
            const nameHint = toolName.replace(/[^a-zA-Z0-9._-]+/g, '_');
            const file = path.join(dir, `${Date.now()}-${nameHint}-${phase}.json`);
            fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
            this.logger.log(`tool HTTP debug file tool=${toolName} path=${file}`);
        }
        catch (err) {
            this.logger.warn(`tool-engine debug file write failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    redactSecret(value) {
        if (value == null || String(value).trim() === '') {
            return '';
        }
        const s = String(value);
        if (s.length <= 6) {
            return '***';
        }
        return `${s.slice(0, 4)}…[redacted len=${s.length}]`;
    }
    redactHeaders(headers) {
        const sensitive = /^(authorization|proxy-authorization)$/i;
        const out = Object.assign({}, headers);
        for (const key of Object.keys(out)) {
            if (sensitive.test(key) || /api-key|apikey|token/i.test(key)) {
                out[key] = this.redactSecret(out[key]);
            }
        }
        return out;
    }
};
ToolEngineService.MAX_TIMEOUT_MS = 2147483647;
ToolEngineService = ToolEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        outbound_http_service_1.OutboundHttpService])
], ToolEngineService);
exports.ToolEngineService = ToolEngineService;
//# sourceMappingURL=tool-engine.service.js.map