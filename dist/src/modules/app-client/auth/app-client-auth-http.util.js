"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHttpProfileAccount = exports.buildBrowserLikeHeaders = exports.formatFetchError = exports.parseFetchBody = exports.mapHttpProfileResponse = exports.resolveProfilePayloadRoot = exports.pickMappedField = void 0;
const common_1 = require("@nestjs/common");
const outbound_http_policy_util_1 = require("../../../core/outbound-http/outbound-http.policy.util");
const app_client_auth_profile_util_1 = require("./app-client-auth-profile.util");
function pickMappedField(source, path) {
    const trimmed = path.trim();
    if (!trimmed) {
        return undefined;
    }
    if (!trimmed.includes('.')) {
        return source[trimmed];
    }
    let current = source;
    for (const segment of trimmed.split('.')) {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
exports.pickMappedField = pickMappedField;
function asTrimmedString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
}
function resolveProfilePayloadRoot(payload, responseRoot) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new common_1.UnauthorizedException('invalid external account response');
    }
    const row = payload;
    const rootPath = responseRoot === null || responseRoot === void 0 ? void 0 : responseRoot.trim();
    if (!rootPath) {
        return row;
    }
    const nested = pickMappedField(row, rootPath);
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
        throw new common_1.UnauthorizedException(`external account response root "${rootPath}" not found`);
    }
    return nested;
}
exports.resolveProfilePayloadRoot = resolveProfilePayloadRoot;
function mapHttpProfileResponse(payload, mapping, responseRoot) {
    if (!mapping || Object.keys(mapping).length === 0) {
        return { active: true };
    }
    const row = payload && typeof payload === 'object' && !Array.isArray(payload)
        ? resolveProfilePayloadRoot(payload, responseRoot)
        : {};
    const employeeId = mapping.employeeId
        ? asTrimmedString(pickMappedField(row, mapping.employeeId))
        : undefined;
    const email = mapping.email
        ? asTrimmedString(pickMappedField(row, mapping.email))
        : undefined;
    const nickName = mapping.nickName
        ? asTrimmedString(pickMappedField(row, mapping.nickName))
        : undefined;
    const cnName = mapping.cnName
        ? asTrimmedString(pickMappedField(row, mapping.cnName))
        : undefined;
    const usernameFromMapping = mapping.username
        ? asTrimmedString(pickMappedField(row, mapping.username))
        : undefined;
    const activeRaw = mapping.active
        ? pickMappedField(row, mapping.active)
        : undefined;
    return Object.assign(Object.assign(Object.assign(Object.assign({}, (employeeId ? { employeeId } : {})), (email ? { email } : {})), (usernameFromMapping ? { username: usernameFromMapping } : {})), { nickName,
        cnName, active: activeRaw !== false });
}
exports.mapHttpProfileResponse = mapHttpProfileResponse;
async function parseFetchBody(response) {
    var _a;
    const text = await response.text();
    if (!text) {
        return null;
    }
    const contentType = (_a = response.headers.get('content-type')) !== null && _a !== void 0 ? _a : '';
    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(text);
        }
        catch (_b) {
            return text;
        }
    }
    try {
        return JSON.parse(text);
    }
    catch (_c) {
        return text;
    }
}
exports.parseFetchBody = parseFetchBody;
function formatFetchError(error) {
    if (!(error instanceof Error)) {
        return String(error);
    }
    const cause = error.cause;
    if (cause instanceof Error) {
        const code = 'code' in cause && typeof cause.code === 'string' ? cause.code : '';
        return code ? `${cause.message} (${code})` : cause.message;
    }
    return error.message;
}
exports.formatFetchError = formatFetchError;
function buildBrowserLikeHeaders(origin, extra = {}) {
    const host = new URL(origin).host;
    return Object.assign({ Host: host, Connection: 'keep-alive', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', Accept: 'application/json, text/plain, */*', 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' }, extra);
}
exports.buildBrowserLikeHeaders = buildBrowserLikeHeaders;
function applyTokenPlacement(url, headers, accountToken, placement) {
    switch (placement) {
        case 'authorization_bearer':
            headers.Authorization = `Bearer ${accountToken}`;
            return;
        case 'header_x_account_token':
            headers['x-account-token'] = accountToken;
            return;
        case 'query_token':
            url.searchParams.set('token', accountToken);
            return;
        default:
            headers.Authorization = `Bearer ${accountToken}`;
    }
}
function joinProfileUrl(baseUrl, profilePath) {
    const base = baseUrl.replace(/\/+$/, '');
    const path = profilePath.startsWith('/') ? profilePath : `/${profilePath}`;
    return new URL(`${base}${path}`);
}
async function fetchHttpProfileAccount(http, accountToken, appClientId) {
    var _a, _b, _c;
    const accountUrl = joinProfileUrl(http.baseUrl, http.profilePath);
    const headers = buildBrowserLikeHeaders(accountUrl.origin, (_a = http.extraHeaders) !== null && _a !== void 0 ? _a : {});
    applyTokenPlacement(accountUrl, headers, accountToken, (_b = http.tokenPlacement) !== null && _b !== void 0 ? _b : 'authorization_bearer');
    let accountResponse;
    const timeoutMs = (0, outbound_http_policy_util_1.readAppClientAuthTimeoutMs)();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        accountResponse = await fetch(accountUrl, {
            method: (_c = http.method) !== null && _c !== void 0 ? _c : 'GET',
            headers,
            signal: controller.signal,
        });
    }
    catch (error) {
        const aborted = error instanceof Error && error.name === 'AbortError';
        const detail = aborted
            ? `request timed out after ${timeoutMs}ms`
            : formatFetchError(error);
        throw new common_1.ServiceUnavailableException(`无法连接外部账号服务 ${accountUrl.origin}：${detail}。请检查 authConfig.http、VPN/内网连通性及 x-account-token 是否有效。`);
    }
    finally {
        clearTimeout(timer);
    }
    const account = await parseFetchBody(accountResponse);
    if (!accountResponse.ok) {
        throw new common_1.UnauthorizedException(`external account verification failed: ${accountResponse.status}`);
    }
    const partial = mapHttpProfileResponse(account, http.mapping, http.responseRoot);
    return (0, app_client_auth_profile_util_1.normalizeExternalAccountProfile)(partial, { appClientId, accountToken });
}
exports.fetchHttpProfileAccount = fetchHttpProfileAccount;
//# sourceMappingURL=app-client-auth-http.util.js.map