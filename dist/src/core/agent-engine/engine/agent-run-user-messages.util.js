"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAgentRunFailureCode = exports.resolveAgentRunFailureUserMessage = exports.resolveLlmFailureCode = exports.resolveToolFailureCode = exports.buildLlmFailureUserMessage = exports.buildIntentScopeFailureUserMessage = exports.buildToolFailureUserMessage = exports.buildToolErrorObservation = exports.formatResponseSourceForDisplay = exports.extractToolErrorResponseSource = exports.extractToolErrorCode = exports.extractToolErrorUserHint = exports.isAgentToolErrorObservation = void 0;
const common_1 = require("@nestjs/common");
const outbound_http_types_1 = require("../../outbound-http/outbound-http.types");
const tool_response_source_util_1 = require("../../tool-engine/tool-response-source.util");
const requested_skill_run_error_1 = require("./main/skill/requested-skill-run.error");
const requested_skill_run_service_1 = require("./main/skill/requested-skill-run.service");
function isAgentToolErrorObservation(output) {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
        return false;
    }
    const row = output;
    return row._agentToolError === true && typeof row.userHint === 'string';
}
exports.isAgentToolErrorObservation = isAgentToolErrorObservation;
function extractToolErrorUserHint(output) {
    if (!isAgentToolErrorObservation(output)) {
        return null;
    }
    const hint = output.userHint.trim();
    return hint.length > 0 ? hint : null;
}
exports.extractToolErrorUserHint = extractToolErrorUserHint;
function extractToolErrorCode(output) {
    if (!isAgentToolErrorObservation(output)) {
        return null;
    }
    return output.code;
}
exports.extractToolErrorCode = extractToolErrorCode;
function extractToolErrorResponseSource(output) {
    if (!isAgentToolErrorObservation(output)) {
        return undefined;
    }
    return output.responseSource;
}
exports.extractToolErrorResponseSource = extractToolErrorResponseSource;
function parseHttpStatusFromToolError(error) {
    if (error instanceof tool_response_source_util_1.ToolHttpResponseError) {
        return error.httpResponse.status;
    }
    const text = error instanceof Error ? error.message : String(error);
    const match = text.match(/\bfailed:\s*(\d{3})\b/i);
    if (!match) {
        return undefined;
    }
    const status = Number.parseInt(match[1], 10);
    return Number.isFinite(status) ? status : undefined;
}
function resolveToolErrorResponseSource(error) {
    if (error instanceof tool_response_source_util_1.ToolHttpResponseError) {
        return error.httpResponse.bodyText;
    }
    if (error instanceof Error && !(error instanceof tool_response_source_util_1.ToolHttpResponseError)) {
        return error.message;
    }
    return undefined;
}
function formatResponseSourceForDisplay(source) {
    if (source === null || source === undefined) {
        return '';
    }
    if (typeof source === 'string') {
        const trimmed = source.trim();
        if (!trimmed) {
            return '';
        }
        try {
            return JSON.stringify(JSON.parse(trimmed), null, 2);
        }
        catch (_a) {
            return trimmed;
        }
    }
    try {
        return JSON.stringify(source, null, 2);
    }
    catch (_b) {
        return String(source);
    }
}
exports.formatResponseSourceForDisplay = formatResponseSourceForDisplay;
function extractDownstreamMessage(responseSource) {
    if (responseSource == null) {
        return null;
    }
    let row = null;
    if (typeof responseSource === 'string') {
        const trimmed = responseSource.trim();
        if (!trimmed) {
            return null;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                row = parsed;
            }
        }
        catch (_a) {
            return trimmed.length <= 240 ? trimmed : `${trimmed.slice(0, 240)}…`;
        }
    }
    else if (typeof responseSource === 'object' &&
        !Array.isArray(responseSource)) {
        row = responseSource;
    }
    if (!row) {
        return null;
    }
    const parts = [];
    for (const key of ['message', 'errorKey', 'type', 'code']) {
        const value = row[key];
        if (value != null && String(value).trim().length > 0) {
            parts.push(`${key}=${String(value).trim()}`);
        }
    }
    return parts.length > 0 ? parts.join(', ') : null;
}
function buildToolErrorObservation(error, context) {
    const detail = error instanceof Error ? error.message : String(error);
    const httpStatus = parseHttpStatusFromToolError(error);
    const responseSource = resolveToolErrorResponseSource(error);
    return Object.assign(Object.assign({ _agentToolError: true, userHint: buildToolFailureUserMessage(error, {
            isMutation: context === null || context === void 0 ? void 0 : context.isMutation,
            httpStatus,
            responseSource,
        }), detail, code: resolveToolFailureCode(error, { httpStatus }) }, (responseSource !== undefined ? { responseSource } : {})), (httpStatus !== undefined ? { httpStatus } : {}));
}
exports.buildToolErrorObservation = buildToolErrorObservation;
function buildToolFailureUserMessage(error, context) {
    var _a;
    const text = error instanceof Error ? error.message : String(error);
    const lower = text.toLowerCase();
    const httpStatus = (_a = context === null || context === void 0 ? void 0 : context.httpStatus) !== null && _a !== void 0 ? _a : parseHttpStatusFromToolError(error);
    const downstreamMsg = extractDownstreamMessage(context === null || context === void 0 ? void 0 : context.responseSource);
    const isMutation = (context === null || context === void 0 ? void 0 : context.isMutation) === true;
    if (error instanceof outbound_http_types_1.OutboundHttpError) {
        if (error.kind === 'timeout') {
            return isMutation
                ? '写操作超时，请稍后重试或联系管理员。'
                : '查询超时，未能获取到数据。请缩小查询范围或稍后再试。';
        }
        if (error.kind === 'abort') {
            return isMutation
                ? '写操作已取消。'
                : '查询已取消。';
        }
        if (error.kind === 'network') {
            return isMutation
                ? '无法连接下游服务，写操作未完成。请稍后重试或联系管理员。'
                : '无法连接下游服务，请检查网络或稍后重试。';
        }
    }
    if (lower.includes('401') ||
        lower.includes('403') ||
        lower.includes('auth unresolved') ||
        lower.includes('api key')) {
        return '当前账号暂无权限访问该数据，请确认已绑定正确的集成密钥后再试。';
    }
    if (lower.includes('abort') ||
        lower.includes('timeout') ||
        lower.includes('timed out') ||
        lower.includes('etimedout')) {
        return isMutation
            ? '写操作超时，请稍后重试或联系管理员。'
            : '查询超时，未能获取到数据。请缩小查询范围或稍后再试。';
    }
    if (httpStatus != null && httpStatus >= 400) {
        if (isMutation) {
            if (httpStatus >= 500) {
                return downstreamMsg
                    ? `写操作失败（HTTP ${httpStatus}）：${downstreamMsg}`
                    : `写操作失败：下游服务返回 HTTP ${httpStatus} 错误。`;
            }
            return downstreamMsg
                ? `写操作未通过（HTTP ${httpStatus}）：${downstreamMsg}`
                : `写操作未通过：下游返回 HTTP ${httpStatus}。`;
        }
        if (httpStatus === 404) {
            return '未查询到符合条件的数据，请核对查询条件后重试。';
        }
        if (httpStatus >= 500) {
            return downstreamMsg
                ? `服务暂时不可用（HTTP ${httpStatus}）：${downstreamMsg}`
                : `服务暂时不可用（HTTP ${httpStatus}），请稍后再试。`;
        }
        return downstreamMsg
            ? `请求未成功（HTTP ${httpStatus}）：${downstreamMsg}`
            : `请求未成功（HTTP ${httpStatus}），请核对参数后重试。`;
    }
    if (lower.includes('404') || lower.includes('not found')) {
        return '未查询到符合条件的数据，请核对查询条件后重试。';
    }
    if (lower.includes('not found in bound tools')) {
        return '当前无法调用所需能力，请换个说法或联系管理员检查工具配置。';
    }
    if (lower.includes('did not match expected schema')) {
        return isMutation
            ? '写操作参数未通过校验，请根据工具 schema 修正后重试。'
            : '工具参数未通过校验，请根据工具 schema 修正后重试。';
    }
    return isMutation
        ? '写操作未能完成，请稍后重试；若仍失败请联系管理员。'
        : '未能完成查询，请确认条件后重试；若仍失败请联系管理员。';
}
exports.buildToolFailureUserMessage = buildToolFailureUserMessage;
function buildIntentScopeFailureUserMessage() {
    return '暂时没能准确理解你的问题。请补充具体对象、编号或你想完成的操作，我再帮你处理。';
}
exports.buildIntentScopeFailureUserMessage = buildIntentScopeFailureUserMessage;
function buildLlmFailureUserMessage(error) {
    if (error instanceof outbound_http_types_1.OutboundHttpError) {
        if (error.kind === 'timeout') {
            return '生成回复超时，请稍后重试。';
        }
        if (error.kind === 'network') {
            return '无法连接智能服务，请稍后重试；若持续失败请联系管理员。';
        }
        if (error.kind === 'abort') {
            return '生成已停止。';
        }
    }
    const text = error instanceof Error ? error.message : String(error);
    const lower = text.toLowerCase();
    if (lower.includes('rate limit') ||
        lower.includes('429') ||
        lower.includes('quota')) {
        return '智能服务当前较繁忙，请稍后再试。';
    }
    if (lower.includes('context') ||
        lower.includes('token') ||
        lower.includes('length')) {
        return '对话内容过长，请缩短问题或开启新会话后再试。';
    }
    if (lower.includes('timeout') ||
        lower.includes('abort') ||
        lower.includes('etimedout')) {
        return '生成回复超时，请稍后重试。';
    }
    return '智能回复暂时不可用，请稍后重试；若持续失败请联系管理员。';
}
exports.buildLlmFailureUserMessage = buildLlmFailureUserMessage;
function resolveToolFailureCode(error, context) {
    var _a;
    const text = error instanceof Error ? error.message : String(error);
    const lower = text.toLowerCase();
    const httpStatus = (_a = context === null || context === void 0 ? void 0 : context.httpStatus) !== null && _a !== void 0 ? _a : parseHttpStatusFromToolError(error);
    if (error instanceof outbound_http_types_1.OutboundHttpError) {
        if (error.kind === 'timeout' || error.kind === 'abort') {
            return 'TOOL_TIMEOUT';
        }
        if (error.kind === 'network') {
            return 'TOOL_DOWNSTREAM_ERROR';
        }
    }
    if (lower.includes('401') ||
        lower.includes('403') ||
        lower.includes('auth unresolved') ||
        lower.includes('api key')) {
        return 'TOOL_AUTH_FAILED';
    }
    if (lower.includes('abort') ||
        lower.includes('timeout') ||
        lower.includes('timed out') ||
        lower.includes('etimedout')) {
        return 'TOOL_TIMEOUT';
    }
    if (httpStatus != null && httpStatus >= 400) {
        return 'TOOL_DOWNSTREAM_ERROR';
    }
    if (lower.includes('did not match expected schema')) {
        return 'TOOL_DOWNSTREAM_ERROR';
    }
    return 'TOOL_EMPTY_RESULT';
}
exports.resolveToolFailureCode = resolveToolFailureCode;
function resolveLlmFailureCode(error) {
    if (error instanceof outbound_http_types_1.OutboundHttpError) {
        if (error.kind === 'timeout' || error.kind === 'abort') {
            return 'LLM_TIMEOUT';
        }
        if (error.kind === 'network') {
            return 'LLM_TIMEOUT';
        }
    }
    const text = error instanceof Error ? error.message : String(error);
    const lower = text.toLowerCase();
    if (lower.includes('rate limit') ||
        lower.includes('429') ||
        lower.includes('quota')) {
        return 'LLM_RATE_LIMIT';
    }
    return 'LLM_TIMEOUT';
}
exports.resolveLlmFailureCode = resolveLlmFailureCode;
function resolveAgentRunFailureUserMessage(error) {
    if (error instanceof common_1.NotFoundException) {
        return null;
    }
    if ((0, requested_skill_run_error_1.isRequestedSkillRunError)(error)) {
        return (0, requested_skill_run_service_1.requestedSkillUserMessage)(error.code);
    }
    const raw = error instanceof Error ? error.message : String(error);
    const lower = raw.toLowerCase();
    if (lower.includes('embedding') ||
        lower.includes('intent recall') ||
        lower.includes('category vector recall')) {
        return buildIntentScopeFailureUserMessage();
    }
    if (error instanceof common_1.HttpException) {
        const status = error.getStatus();
        if (status === 404) {
            return null;
        }
        const msg = extractHttpExceptionMessage(error);
        if (status === 400 && msg.includes('exceeded max steps')) {
            return '处理步骤较多未能完成，请简化问题或拆成多次提问。';
        }
        if (msg.includes('tool ') && msg.includes('failed')) {
            return buildToolFailureUserMessage(error);
        }
        return buildLlmFailureUserMessage(error);
    }
    return buildLlmFailureUserMessage(error);
}
exports.resolveAgentRunFailureUserMessage = resolveAgentRunFailureUserMessage;
function resolveAgentRunFailureCode(error) {
    if (error instanceof common_1.NotFoundException) {
        return null;
    }
    if ((0, requested_skill_run_error_1.isRequestedSkillRunError)(error)) {
        return error.code;
    }
    const raw = error instanceof Error ? error.message : String(error);
    const lower = raw.toLowerCase();
    if (lower.includes('embedding') ||
        lower.includes('intent recall') ||
        lower.includes('category vector recall')) {
        return 'INTENT_RECALL_FAILED';
    }
    if (error instanceof common_1.HttpException) {
        const msg = extractHttpExceptionMessage(error);
        if (msg.includes('tool ') && msg.includes('failed')) {
            return resolveToolFailureCode(error);
        }
    }
    return resolveLlmFailureCode(error);
}
exports.resolveAgentRunFailureCode = resolveAgentRunFailureCode;
function extractHttpExceptionMessage(error) {
    const response = error.getResponse();
    if (typeof response === 'string') {
        return response;
    }
    if (response && typeof response === 'object' && 'message' in response) {
        const message = response.message;
        if (typeof message === 'string') {
            return message;
        }
        if (Array.isArray(message)) {
            return message.map(String).join('; ');
        }
    }
    return error.message;
}
//# sourceMappingURL=agent-run-user-messages.util.js.map