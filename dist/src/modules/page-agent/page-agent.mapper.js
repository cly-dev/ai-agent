"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPageAgentLlmProxyAuditDetail = exports.toPageAgentLlmProxyAuditListItem = void 0;
function toPageAgentLlmProxyAuditListItem(row) {
    var _a, _b, _c, _d, _e, _f;
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: (_b = (_a = row.appClient) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : null,
        userId: row.userId,
        username: (_d = (_c = row.user) === null || _c === void 0 ? void 0 : _c.username) !== null && _d !== void 0 ? _d : null,
        userEmail: (_f = (_e = row.user) === null || _e === void 0 ? void 0 : _e.email) !== null && _f !== void 0 ? _f : null,
        modelConfigId: row.modelConfigId,
        requestedModel: row.requestedModel,
        provider: row.provider,
        providerModel: row.providerModel,
        status: row.status,
        upstreamStatus: row.upstreamStatus,
        durationMs: row.durationMs,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        totalTokens: row.totalTokens,
        createdAt: row.createdAt,
        finishedAt: row.finishedAt,
    };
}
exports.toPageAgentLlmProxyAuditListItem = toPageAgentLlmProxyAuditListItem;
function toPageAgentLlmProxyAuditDetail(row) {
    return Object.assign(Object.assign({}, toPageAgentLlmProxyAuditListItem(row)), { requestMeta: row.requestMeta, errorMessage: row.errorMessage });
}
exports.toPageAgentLlmProxyAuditDetail = toPageAgentLlmProxyAuditDetail;
//# sourceMappingURL=page-agent.mapper.js.map