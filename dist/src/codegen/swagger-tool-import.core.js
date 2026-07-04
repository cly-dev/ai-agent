"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSwaggerTools = exports.buildToolDrafts = exports.listOperations = exports.applyTools = exports.resolveTargetAgentId = exports.resolveIntegrationId = exports.promptSwaggerSpecUrl = exports.resolveSelectedOperationKeys = exports.loadOpenApiSpec = exports.resolveIntegrationAuthMode = exports.toSwaggerImportContext = exports.resolveRiskLevelByHttpVerb = exports.DEFAULT_SWAGGER_SPEC_URL = void 0;
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const readline = require("readline/promises");
const client_1 = require("../../generated/prisma/client");
const tool_definition_key_util_1 = require("../common/tool/tool-definition-key.util");
const tool_agent_metadata_util_1 = require("../core/tool-engine/tool-agent-metadata.util");
const tool_decision_input_util_1 = require("../core/tool-engine/tool-decision-input.util");
const tool_decision_role_enum_1 = require("../core/tool-engine/tool-decision-role.enum");
const tool_path_filter_util_1 = require("./tool-path-filter.util");
exports.DEFAULT_SWAGGER_SPEC_URL = 'https://api.ads.a-premium-test.com/v3/api-docs';
const ADMIN_ROLE_CANDIDATES = ['admin', 'super_admin'];
const OPERATOR_ROLE_CANDIDATES = ['operator'];
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const METHOD_ENUM_MAP = {
    get: client_1.HttpMethod.Get,
    post: client_1.HttpMethod.Post,
    put: client_1.HttpMethod.Put,
    patch: client_1.HttpMethod.Put,
    delete: client_1.HttpMethod.Delete,
};
function resolveRiskLevelByHttpVerb(method) {
    switch (method) {
        case 'get':
            return client_1.ToolLevel.L1;
        case 'post':
        case 'put':
        case 'patch':
            return client_1.ToolLevel.L2;
        case 'delete':
            return client_1.ToolLevel.L3;
        default:
            return client_1.ToolLevel.L1;
    }
}
exports.resolveRiskLevelByHttpVerb = resolveRiskLevelByHttpVerb;
function toSwaggerImportContext(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const specUrl = input.specUrl.trim();
    if (!specUrl && !((_a = input.specPath) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new Error('specUrl or specPath is required');
    }
    if (!input.autoIntegration && input.integrationId == null) {
        throw new Error('integrationId is required when autoIntegration is disabled');
    }
    const dryRun = (_b = input.dryRun) !== null && _b !== void 0 ? _b : false;
    return {
        specPath: ((_c = input.specPath) === null || _c === void 0 ? void 0 : _c.trim()) || undefined,
        specUrl: specUrl || exports.DEFAULT_SWAGGER_SPEC_URL,
        integrationId: (_d = input.integrationId) !== null && _d !== void 0 ? _d : null,
        appClientId: (_e = input.appClientId) !== null && _e !== void 0 ? _e : null,
        agentId: (_f = input.agentId) !== null && _f !== void 0 ? _f : null,
        autoIntegration: (_g = input.autoIntegration) !== null && _g !== void 0 ? _g : false,
        integrationName: input.integrationName,
        integrationBaseUrl: input.integrationBaseUrl,
        integrationApiKey: (_j = (_h = input.integrationApiKey) === null || _h === void 0 ? void 0 : _h.trim()) !== null && _j !== void 0 ? _j : '',
        integrationAuthMode: (_k = input.integrationAuthMode) !== null && _k !== void 0 ? _k : client_1.IntegrationAuthMode.USER_PREFERRED,
        dryRun,
        apply: !dryRun,
        insecure: (_l = input.insecure) !== null && _l !== void 0 ? _l : false,
        tags: new Set(((_m = input.tags) !== null && _m !== void 0 ? _m : []).map((item) => item.trim()).filter(Boolean)),
        ops: new Set(((_o = input.ops) !== null && _o !== void 0 ? _o : []).map((item) => item.trim()).filter(Boolean)),
        pathInclude: new Set(((_p = input.pathInclude) !== null && _p !== void 0 ? _p : []).map((item) => item.trim()).filter(Boolean)),
        pathExclude: new Set(((_q = input.pathExclude) !== null && _q !== void 0 ? _q : []).map((item) => item.trim()).filter(Boolean)),
        noDefaultPathExclude: (_r = input.noDefaultPathExclude) !== null && _r !== void 0 ? _r : false,
    };
}
exports.toSwaggerImportContext = toSwaggerImportContext;
function resolveIntegrationAuthMode(raw) {
    const mode = (raw !== null && raw !== void 0 ? raw : 'USER_PREFERRED').trim().toUpperCase();
    if (mode !== 'USER_ONLY' &&
        mode !== 'SYSTEM_ONLY' &&
        mode !== 'USER_PREFERRED') {
        throw new Error('integration auth mode must be one of: USER_ONLY, SYSTEM_ONLY, USER_PREFERRED');
    }
    return mode;
}
exports.resolveIntegrationAuthMode = resolveIntegrationAuthMode;
function resolvePathFilter(options) {
    return (0, tool_path_filter_util_1.buildPathFilter)({
        include: options.pathInclude,
        exclude: options.pathExclude,
        useDefaultExclude: !options.noDefaultPathExclude,
    });
}
function hasExplicitPathInclude(options) {
    return options.pathInclude.size > 0;
}
function opKey(method, urlPath) {
    return `${method.toUpperCase()}:${urlPath}`;
}
function normalizeOpSelector(raw) {
    const parts = raw.split(':');
    if (parts.length !== 2) {
        throw new Error(`invalid op selector: ${raw}. expected METHOD:/path`);
    }
    const method = parts[0].trim().toUpperCase();
    const methodSet = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    if (!methodSet.has(method)) {
        throw new Error(`invalid method in op selector: ${raw}`);
    }
    const urlPath = normalizePath(parts[1].trim());
    return `${method}:${urlPath}`;
}
function normalizePath(urlPath) {
    if (urlPath.startsWith('/')) {
        return urlPath;
    }
    return `/${urlPath}`;
}
function buildToolName(operation, method, urlPath) {
    var _a;
    const raw = (_a = operation.operationId) === null || _a === void 0 ? void 0 : _a.trim();
    if (raw) {
        return raw;
    }
    return `${method}_${urlPath.replace(/\W+/g, '_').replace(/^_+|_+$/g, '')}`;
}
function buildDescription(operation, method, urlPath) {
    var _a, _b, _c, _d;
    return ((_d = (_b = (_a = operation.summary) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_c = operation.description) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : `${method.toUpperCase()} ${urlPath}`);
}
function toInputJsonValue(value) {
    return JSON.parse(JSON.stringify(value !== null && value !== void 0 ? value : null));
}
const SPEC_DOWNLOAD_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SPEC_DOWNLOAD_TIMEOUT_MS = 120000;
const SPEC_DOWNLOAD_MAX_REDIRECTS = 10;
const SPEC_DOWNLOAD_MAX_ATTEMPTS = 3;
const SPEC_DOWNLOAD_RETRY_BASE_MS = 600;
function headerLocation(headers) {
    const raw = headers['location'];
    if (typeof raw === 'string') {
        return raw;
    }
    if (Array.isArray(raw)) {
        const first = raw[0];
        return typeof first === 'string' ? first : undefined;
    }
    return undefined;
}
function isTransientNetworkError(err) {
    if (!err || typeof err !== 'object') {
        return false;
    }
    const code = err.code;
    if (typeof code === 'string') {
        return (code === 'ECONNRESET' ||
            code === 'ECONNREFUSED' ||
            code === 'ETIMEDOUT' ||
            code === 'EPIPE' ||
            code === 'ENETUNREACH' ||
            code === 'EAI_AGAIN');
    }
    return false;
}
function requestUrlOnce(urlString, insecure) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const target = new URL(urlString);
        if (target.protocol !== 'http:' && target.protocol !== 'https:') {
            reject(new Error(`unsupported URL protocol: ${target.protocol}`));
            return;
        }
        const isHttps = target.protocol === 'https:';
        const lib = isHttps ? https : http;
        const defaultPort = isHttps ? 443 : 80;
        const options = {
            hostname: target.hostname,
            port: target.port || defaultPort,
            path: `${target.pathname}${target.search}`,
            method: 'GET',
            headers: {
                Accept: 'application/json, */*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': SPEC_DOWNLOAD_USER_AGENT,
            },
        };
        if (isHttps) {
            options.rejectUnauthorized = !insecure;
        }
        const req = lib.request(options, (incoming) => {
            var _a;
            const statusCode = (_a = incoming.statusCode) !== null && _a !== void 0 ? _a : 0;
            const headers = incoming.headers;
            if (statusCode >= 300 && statusCode < 400 && headerLocation(headers)) {
                incoming.resume();
                settled = true;
                resolve({ statusCode, headers, body: '' });
                return;
            }
            if (!statusCode || statusCode >= 400) {
                incoming.resume();
                settled = true;
                resolve({ statusCode, headers, body: '' });
                return;
            }
            let body = '';
            incoming.setEncoding('utf-8');
            incoming.on('data', (chunk) => {
                body += chunk;
            });
            incoming.on('end', () => {
                settled = true;
                resolve({ statusCode, headers, body });
            });
        });
        req.on('error', (err) => {
            if (!settled) {
                settled = true;
                reject(err);
            }
        });
        req.setTimeout(SPEC_DOWNLOAD_TIMEOUT_MS, () => {
            req.destroy();
            if (!settled) {
                settled = true;
                reject(new Error('request timeout'));
            }
        });
        req.end();
    });
}
async function loadSpecFromRemoteUrl(initialUrl, insecure) {
    let lastErr;
    for (let attempt = 0; attempt < SPEC_DOWNLOAD_MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
            const delay = SPEC_DOWNLOAD_RETRY_BASE_MS * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delay));
        }
        let currentUrl = initialUrl;
        try {
            for (let hop = 0; hop < SPEC_DOWNLOAD_MAX_REDIRECTS; hop += 1) {
                const res = await requestUrlOnce(currentUrl, insecure);
                const { statusCode, headers } = res;
                const nextLocation = headerLocation(headers);
                if (statusCode >= 300 && statusCode < 400 && nextLocation) {
                    currentUrl = new URL(nextLocation, currentUrl).toString();
                    continue;
                }
                if (!statusCode || statusCode >= 400) {
                    throw new Error(`failed to download spec: HTTP ${statusCode || 'unknown'}`);
                }
                return res.body;
            }
            throw new Error(`too many redirects (max ${SPEC_DOWNLOAD_MAX_REDIRECTS})`);
        }
        catch (err) {
            lastErr = err;
            const retriable = isTransientNetworkError(err) ||
                (err instanceof Error && err.message === 'request timeout');
            if (retriable && attempt < SPEC_DOWNLOAD_MAX_ATTEMPTS - 1) {
                continue;
            }
            if (isTransientNetworkError(err)) {
                const code = err.code;
                throw new Error(`download spec failed (${code !== null && code !== void 0 ? code : 'network'}): ${err instanceof Error ? err.message : String(err)}. try: --insecure (TLS), retry, or curl the URL to --spec-path`);
            }
            throw err;
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
async function loadOpenApiSpec(options) {
    const raw = options.specPath
        ? fs.readFileSync(path.resolve(process.cwd(), options.specPath), 'utf-8')
        : await loadSpecFromRemoteUrl(options.specUrl, options.insecure);
    const parsed = JSON.parse(raw);
    if (!parsed.paths || typeof parsed.paths !== 'object') {
        throw new Error('invalid openapi spec: missing paths');
    }
    return parsed;
}
exports.loadOpenApiSpec = loadOpenApiSpec;
function operationPrimaryTag(operation) {
    var _a, _b;
    return ((_b = (_a = operation.tags) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.trim()) || 'misc';
}
function buildTagDescriptionMap(spec) {
    const map = new Map();
    const rootTags = spec.tags;
    if (!Array.isArray(rootTags)) {
        return map;
    }
    for (const item of rootTags) {
        if (!item || typeof item !== 'object') {
            continue;
        }
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const desc = typeof item.description === 'string' ? item.description.trim() : '';
        if (name && desc) {
            map.set(name, desc);
        }
    }
    return map;
}
function listOperations(spec, pathFilter) {
    var _a;
    const items = [];
    for (const [urlPath, pathItem] of Object.entries((_a = spec.paths) !== null && _a !== void 0 ? _a : {})) {
        if (!(0, tool_path_filter_util_1.matchesPathFilter)(urlPath, pathFilter)) {
            continue;
        }
        for (const method of HTTP_METHODS) {
            const operation = pathItem[method];
            if (!operation) {
                continue;
            }
            items.push({
                key: opKey(method, urlPath),
                method,
                urlPath,
                tag: operationPrimaryTag(operation),
                operation,
            });
        }
    }
    items.sort((a, b) => {
        const tagCmp = a.tag.localeCompare(b.tag);
        if (tagCmp !== 0) {
            return tagCmp;
        }
        const pathCmp = a.urlPath.localeCompare(b.urlPath);
        if (pathCmp !== 0) {
            return pathCmp;
        }
        return a.method.localeCompare(b.method);
    });
    return items;
}
exports.listOperations = listOperations;
function parseIndexSelection(input, max) {
    const value = input.trim();
    if (/^(all|\*)$/i.test(value)) {
        return new Set(Array.from({ length: max }, (_, idx) => idx + 1));
    }
    const selected = new Set();
    for (const part of value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)) {
        if (/^\d+\s*-\s*\d+$/.test(part)) {
            const [start, end] = part.split('-').map((item) => Number(item.trim()));
            if (!Number.isInteger(start) ||
                !Number.isInteger(end) ||
                start < 1 ||
                end > max ||
                start > end) {
                throw new Error(`invalid range: ${part}`);
            }
            for (let i = start; i <= end; i += 1) {
                selected.add(i);
            }
        }
        else {
            const index = Number(part);
            if (!Number.isInteger(index) || index < 1 || index > max) {
                throw new Error(`invalid index: ${part}`);
            }
            selected.add(index);
        }
    }
    if (selected.size === 0) {
        throw new Error('no operations selected');
    }
    return selected;
}
async function promptSelectOperationKeys(operations) {
    var _a;
    console.log('\nSwagger directories (grouped by tag):');
    let currentTag = '';
    const indexToKey = new Map();
    let idx = 0;
    for (const item of operations) {
        if (item.tag !== currentTag) {
            currentTag = item.tag;
            console.log(`\n- ${currentTag}`);
        }
        idx += 1;
        indexToKey.set(idx, item.key);
        const summary = (_a = item.operation.summary) === null || _a === void 0 ? void 0 : _a.trim();
        console.log(`  ${idx}. [${item.method.toUpperCase()}] ${item.urlPath}${summary ? ` - ${summary}` : ''}`);
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        const answer = await rl.question('\nSelect operations (e.g. 1,3,5-8 or all): ');
        const indexes = parseIndexSelection(answer, operations.length);
        const keys = new Set();
        for (const index of indexes) {
            const key = indexToKey.get(index);
            if (key) {
                keys.add(key);
            }
        }
        return keys;
    }
    finally {
        rl.close();
    }
}
async function resolveSelectedOperationKeys(options, operations, selectionMode) {
    const allKeys = new Set(operations.map((item) => item.key));
    if (options.ops.size > 0) {
        const selected = new Set();
        for (const raw of options.ops) {
            const normalized = normalizeOpSelector(raw);
            if (!allKeys.has(normalized)) {
                throw new Error(`operation not found in spec: ${normalized}`);
            }
            selected.add(normalized);
        }
        return selected;
    }
    if (options.tags.size > 0) {
        const availableTags = new Set(operations.map((item) => item.tag));
        for (const tag of options.tags) {
            if (!availableTags.has(tag)) {
                throw new Error(`tag not found in spec: ${tag}`);
            }
        }
        return new Set(operations
            .filter((item) => options.tags.has(item.tag))
            .map((item) => item.key));
    }
    if (hasExplicitPathInclude(options)) {
        if (operations.length === 0) {
            throw new Error('no operations matched --path-include / path-exclude filters');
        }
        return new Set(operations.map((item) => item.key));
    }
    if (selectionMode === 'api-default-all') {
        if (operations.length === 0) {
            throw new Error('no operations matched path filters');
        }
        return new Set(operations.map((item) => item.key));
    }
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error('interactive selection requires TTY. use --tags, --ops, or --path-include in non-interactive mode');
    }
    return promptSelectOperationKeys(operations);
}
exports.resolveSelectedOperationKeys = resolveSelectedOperationKeys;
async function promptSwaggerSpecUrl(defaultUrl) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        const answer = await rl.question(`\n请输入 tools 文档地址（Swagger URL，回车使用默认值 ${defaultUrl}）: `);
        const value = answer.trim();
        return value || defaultUrl;
    }
    finally {
        rl.close();
    }
}
exports.promptSwaggerSpecUrl = promptSwaggerSpecUrl;
function buildToolDrafts(spec, pathFilter, selectedKeys, integrationId) {
    var _a, _b, _c, _d, _e;
    const tagDescriptions = buildTagDescriptionMap(spec);
    const drafts = [];
    for (const [urlPath, pathItem] of Object.entries((_a = spec.paths) !== null && _a !== void 0 ? _a : {})) {
        if (!(0, tool_path_filter_util_1.matchesPathFilter)(urlPath, pathFilter)) {
            continue;
        }
        for (const method of HTTP_METHODS) {
            const operation = pathItem[method];
            if (!operation) {
                continue;
            }
            if (!selectedKeys.has(opKey(method, urlPath))) {
                continue;
            }
            const inputSchema = toInputJsonValue({
                parameters: (_b = operation.parameters) !== null && _b !== void 0 ? _b : [],
                requestBody: (_c = operation.requestBody) !== null && _c !== void 0 ? _c : null,
            });
            const outputSchema = operation.responses
                ? toInputJsonValue(operation.responses)
                : null;
            const categoryLabel = operationPrimaryTag(operation);
            const categoryDescription = (_d = tagDescriptions.get(categoryLabel)) !== null && _d !== void 0 ? _d : null;
            const name = buildToolName(operation, method, urlPath);
            const agentMetadataInferred = (0, tool_agent_metadata_util_1.inferAgentMetadataFromOpenApi)({
                method,
                path: normalizePath(urlPath),
                name,
                description: buildDescription(operation, method, urlPath),
                inputSchema,
            });
            const agentMetadata = (_e = (0, tool_decision_input_util_1.normalizeAgentMetadataForPersist)(agentMetadataInferred, inputSchema)) !== null && _e !== void 0 ? _e : agentMetadataInferred;
            drafts.push({
                definitionKey: (0, tool_definition_key_util_1.buildToolDefinitionKey)({
                    categoryLabel,
                    method,
                    path: normalizePath(urlPath),
                    name,
                    operationId: operation.operationId,
                }),
                name,
                description: buildDescription(operation, method, urlPath),
                method: METHOD_ENUM_MAP[method],
                path: normalizePath(urlPath),
                riskLevel: resolveRiskLevelByHttpVerb(method),
                schema: inputSchema,
                inputSchema,
                outputSchema,
                agentMetadata: agentMetadata,
                responseProfile: (0, tool_agent_metadata_util_1.mergeDecisionRoleIntoResponseProfile)((0, tool_decision_role_enum_1.buildSwaggerImportResponseProfile)(method, agentMetadata), agentMetadata, method),
                integrationId,
                isActive: true,
                categoryLabel,
                categoryDescription,
            });
        }
    }
    return drafts;
}
exports.buildToolDrafts = buildToolDrafts;
function normalizeBaseUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        throw new Error('integration base url cannot be empty');
    }
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname && parsed.pathname !== '/'
        ? parsed.pathname.replace(/\/+$/g, '')
        : '';
    return `${parsed.origin}${pathname}`;
}
function resolveIntegrationBaseUrl(options, spec) {
    var _a, _b;
    if (options.integrationBaseUrl) {
        return normalizeBaseUrl(options.integrationBaseUrl);
    }
    const firstServer = (_b = (_a = spec.servers) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url;
    if (firstServer && firstServer.trim()) {
        return normalizeBaseUrl(firstServer);
    }
    return normalizeBaseUrl(options.specUrl);
}
function resolveIntegrationName(options, spec) {
    var _a, _b, _c, _d, _e;
    const value = (_e = (_b = (_a = options.integrationName) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_d = (_c = spec.info) === null || _c === void 0 ? void 0 : _c.title) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : 'swagger-integration';
    return value.length > 0 ? value : 'swagger-integration';
}
async function resolveIntegrationId(prisma, options, spec) {
    if (!options.autoIntegration) {
        if (options.integrationId === null) {
            throw new Error('integration-id is required when auto-integration is disabled');
        }
        return options.integrationId;
    }
    if (options.appClientId === null) {
        const fallbackAppClient = await prisma.appClient.findFirst({
            select: { id: true, name: true },
            orderBy: { id: 'asc' },
        });
        if (!fallbackAppClient) {
            throw new Error('app-client-id is required when auto-integration is enabled and no appClient exists');
        }
        options.appClientId = fallbackAppClient.id;
        console.log(`auto selected appClient: ${fallbackAppClient.id} (${fallbackAppClient.name})`);
    }
    const baseUrl = resolveIntegrationBaseUrl(options, spec);
    const name = resolveIntegrationName(options, spec);
    const existing = await prisma.integration.findFirst({
        where: {
            appClientId: options.appClientId,
            baseUrl,
        },
        select: { id: true },
        orderBy: { id: 'asc' },
    });
    if (existing) {
        return existing.id;
    }
    const created = await prisma.integration.create({
        data: {
            appClientId: options.appClientId,
            name,
            baseUrl,
            apiKey: options.integrationApiKey,
            authMode: options.integrationAuthMode,
        },
        select: { id: true },
    });
    return created.id;
}
exports.resolveIntegrationId = resolveIntegrationId;
async function promptSelectAgentId(agents) {
    console.log('\nAvailable agents under current appClient:');
    for (const agent of agents) {
        console.log(`  ${agent.id}. ${agent.name}`);
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        const answer = await rl.question('\nSelect target agent id to bind tools: ');
        const selected = Number(answer.trim());
        if (!Number.isInteger(selected) || selected <= 0) {
            throw new Error('invalid agent id');
        }
        const exists = agents.some((item) => item.id === selected);
        if (!exists) {
            throw new Error(`agent id ${selected} not found in current appClient`);
        }
        return selected;
    }
    finally {
        rl.close();
    }
}
async function resolveTargetAgentId(prisma, options, appClientId, selectionMode) {
    if (options.agentId !== null) {
        const exists = await prisma.agent.findFirst({
            where: { id: options.agentId, appClientId },
            select: { id: true },
        });
        if (!exists) {
            throw new Error(`agent ${options.agentId} not found under appClient ${appClientId}`);
        }
        return options.agentId;
    }
    if (selectionMode === 'api-default-all') {
        return null;
    }
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        return null;
    }
    const agents = await prisma.agent.findMany({
        where: { appClientId },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
    });
    if (agents.length === 0) {
        console.log(`no agents found under appClient ${appClientId}, skip agent binding`);
        return null;
    }
    return promptSelectAgentId(agents);
}
exports.resolveTargetAgentId = resolveTargetAgentId;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function mergeAgentMetadataForSwaggerImport(existing, incoming, inputSchema) {
    const base = !isRecord(existing) || !(0, tool_agent_metadata_util_1.parseAgentMetadata)(existing)
        ? incoming
        : existing;
    const synced = (0, tool_decision_input_util_1.normalizeAgentMetadataForPersist)(base, inputSchema);
    return (synced !== null && synced !== void 0 ? synced : base);
}
function mergeResponseProfileForSwaggerImport(existing, incoming, agentMetadata, method) {
    const incomingRecord = incoming;
    if (!isRecord(existing)) {
        return incoming;
    }
    let merged = Object.assign({}, existing);
    if (!(0, tool_decision_role_enum_1.parseConfiguredToolDecisionRole)(existing.decisionRole)) {
        merged.decisionRole = incomingRecord.decisionRole;
    }
    const existingCore = existing.coreFields;
    const hasCore = Array.isArray(existingCore) && existingCore.length > 0;
    if (!hasCore && Array.isArray(incomingRecord.coreFields)) {
        merged.coreFields = incomingRecord.coreFields;
    }
    merged = (0, tool_agent_metadata_util_1.mergeDecisionRoleIntoResponseProfile)(merged, agentMetadata, method);
    return merged;
}
function draftToToolWriteData(draft, toolCategoryId, appClientId) {
    return {
        definitionKey: draft.definitionKey,
        name: draft.name,
        description: draft.description,
        riskLevel: draft.riskLevel,
        schema: draft.schema,
        inputSchema: draft.inputSchema,
        outputSchema: draft.outputSchema,
        agentMetadata: draft.agentMetadata,
        responseProfile: draft.responseProfile,
        method: draft.method,
        path: draft.path,
        integration: { connect: { id: draft.integrationId } },
        appClient: { connect: { id: appClientId } },
        toolCategory: { connect: { id: toolCategoryId } },
        isActive: draft.isActive,
    };
}
async function ensureToolCategoriesByDrafts(prisma, drafts) {
    const labelToDescription = new Map();
    for (const draft of drafts) {
        if (!labelToDescription.has(draft.categoryLabel)) {
            labelToDescription.set(draft.categoryLabel, draft.categoryDescription);
        }
    }
    const idByLabel = new Map();
    for (const [label, specDescription] of labelToDescription) {
        let row = await prisma.toolCategory.findFirst({
            where: { label },
        });
        if (!row) {
            row = await prisma.toolCategory.create({
                data: {
                    label,
                    description: specDescription,
                },
            });
        }
        else if (specDescription && !row.description) {
            row = await prisma.toolCategory.update({
                where: { id: row.id },
                data: { description: specDescription },
            });
        }
        idByLabel.set(label, row.id);
    }
    return idByLabel;
}
async function applyTools(prisma, drafts, targetAgentId) {
    var _a;
    const categoryIdByLabel = await ensureToolCategoriesByDrafts(prisma, drafts);
    const allRoles = await prisma.role.findMany({
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
    });
    if (allRoles.length === 0) {
        throw new Error('no roles found, cannot bind tool permissions');
    }
    let created = 0;
    let updated = 0;
    const toolIds = [];
    for (const draft of drafts) {
        const toolCategoryId = categoryIdByLabel.get(draft.categoryLabel);
        if (toolCategoryId === undefined) {
            throw new Error(`missing tool category id for label: ${draft.categoryLabel}`);
        }
        const integration = await prisma.integration.findUnique({
            where: { id: draft.integrationId },
            select: { appClientId: true },
        });
        if (!integration) {
            throw new Error(`integration ${draft.integrationId} not found`);
        }
        const toolData = draftToToolWriteData(draft, toolCategoryId, integration.appClientId);
        const existing = await prisma.tool.findFirst({
            where: {
                appClientId: integration.appClientId,
                definitionKey: draft.definitionKey,
            },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                responseProfile: true,
                agentMetadata: true,
            },
        });
        let toolId;
        if (existing) {
            await prisma.tool.update({
                where: { id: existing.id },
                data: {
                    definitionKey: toolData.definitionKey,
                    name: toolData.name,
                    description: toolData.description,
                    riskLevel: toolData.riskLevel,
                    schema: toolData.schema,
                    inputSchema: toolData.inputSchema,
                    outputSchema: toolData.outputSchema,
                    agentMetadata: mergeAgentMetadataForSwaggerImport(existing.agentMetadata, draft.agentMetadata, draft.inputSchema),
                    responseProfile: mergeResponseProfileForSwaggerImport(existing.responseProfile, draft.responseProfile, (_a = (0, tool_agent_metadata_util_1.parseAgentMetadata)(existing.agentMetadata)) !== null && _a !== void 0 ? _a : (0, tool_agent_metadata_util_1.parseAgentMetadata)(draft.agentMetadata), String(draft.method)),
                    isActive: toolData.isActive,
                    toolCategory: toolData.toolCategory,
                    method: draft.method,
                    path: draft.path,
                    integration: toolData.integration,
                },
            });
            toolId = existing.id;
            updated += 1;
        }
        else {
            const createdRow = await prisma.tool.create({
                data: toolData,
                select: { id: true },
            });
            toolId = createdRow.id;
            created += 1;
        }
        toolIds.push(toolId);
        const allowedRoleIds = resolveAllowedRoleIdsByMethod(draft.method, allRoles);
        await syncRoleToolBindings(prisma, toolId, allowedRoleIds);
        if (targetAgentId !== null) {
            await prisma.agentTool.upsert({
                where: {
                    agentId_toolId: {
                        agentId: targetAgentId,
                        toolId,
                    },
                },
                create: {
                    agentId: targetAgentId,
                    toolId,
                },
                update: {},
            });
        }
    }
    return { created, updated, toolIds };
}
exports.applyTools = applyTools;
function resolveAllowedRoleIdsByMethod(method, roles) {
    if (method === client_1.HttpMethod.Get) {
        return roles.map((item) => item.id);
    }
    const normalizedRoles = roles.map((item) => ({
        id: item.id,
        name: item.name.trim().toLowerCase(),
    }));
    const adminRoleIds = normalizedRoles
        .filter((item) => ADMIN_ROLE_CANDIDATES.includes(item.name))
        .map((item) => item.id);
    if (adminRoleIds.length === 0) {
        throw new Error(`admin role not found. expected one of: ${ADMIN_ROLE_CANDIDATES.join(', ')}`);
    }
    if (method === client_1.HttpMethod.Delete) {
        return adminRoleIds;
    }
    const operatorRoleIds = normalizedRoles
        .filter((item) => OPERATOR_ROLE_CANDIDATES.includes(item.name))
        .map((item) => item.id);
    if (operatorRoleIds.length === 0) {
        throw new Error(`operator role not found. expected one of: ${OPERATOR_ROLE_CANDIDATES.join(', ')}`);
    }
    if (method === client_1.HttpMethod.Post || method === client_1.HttpMethod.Put) {
        return Array.from(new Set([...adminRoleIds, ...operatorRoleIds]));
    }
    return roles.map((item) => item.id);
}
async function syncRoleToolBindings(prisma, toolId, allowedRoleIds) {
    if (allowedRoleIds.length === 0) {
        throw new Error(`no allowed roles resolved for tool ${toolId}`);
    }
    await prisma.roleTool.deleteMany({
        where: {
            toolId,
            roleId: { notIn: allowedRoleIds },
        },
    });
    for (const roleId of allowedRoleIds) {
        await prisma.roleTool.upsert({
            where: {
                roleId_toolId: {
                    roleId,
                    toolId,
                },
            },
            create: { roleId, toolId },
            update: {},
        });
    }
}
async function importSwaggerTools(prisma, input, selectionMode) {
    const ctx = toSwaggerImportContext(input);
    const spec = await loadOpenApiSpec(ctx);
    const integrationId = await resolveIntegrationId(prisma, ctx, spec);
    const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
        select: { appClientId: true },
    });
    if (!integration) {
        throw new Error(`integration ${integrationId} not found`);
    }
    const targetAgentId = await resolveTargetAgentId(prisma, ctx, integration.appClientId, selectionMode);
    const pathFilter = resolvePathFilter(ctx);
    const operations = listOperations(spec, pathFilter);
    const selectedKeys = await resolveSelectedOperationKeys(ctx, operations, selectionMode);
    const drafts = buildToolDrafts(spec, pathFilter, selectedKeys, integrationId);
    if (drafts.length === 0) {
        throw new Error('no operations matched filters');
    }
    let created = 0;
    let updated = 0;
    let toolIds = [];
    if (ctx.apply) {
        const applied = await applyTools(prisma, drafts, targetAgentId);
        created = applied.created;
        updated = applied.updated;
        toolIds = applied.toolIds;
    }
    return {
        integrationId,
        appClientId: integration.appClientId,
        agentId: targetAgentId,
        operationCount: operations.length,
        total: drafts.length,
        created,
        updated,
        dryRun: ctx.dryRun,
        pathFilter,
        toolIds,
    };
}
exports.importSwaggerTools = importSwaggerTools;
//# sourceMappingURL=swagger-tool-import.core.js.map