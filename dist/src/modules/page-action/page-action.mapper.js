"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPageActionRunAdminDetail = exports.toPageActionRunAdminListItem = exports.toPageActionResponse = void 0;
const page_action_run_steps_util_1 = require("../../core/page-action/page-action-run-steps.util");
function toPageActionResponse(row) {
    var _a;
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: (_a = row.appClient) === null || _a === void 0 ? void 0 : _a.name,
        actionKey: row.actionKey,
        name: row.name,
        description: row.description,
        hostToolId: row.hostToolId,
        hostToolName: row.hostTool.name,
        pageScope: row.pageScope,
        systemPrompt: row.systemPrompt,
        defaultDelivery: row.defaultDelivery,
        allowCustomInstruction: row.allowCustomInstruction,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        config: row.config,
        sourceSkillId: row.sourceSkillId,
        workflowId: row.workflowId,
        workflowVersion: row.workflowVersion,
        workflowOverrides: row.workflowOverrides,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
exports.toPageActionResponse = toPageActionResponse;
function parseRunSteps(value) {
    return page_action_run_steps_util_1.PageActionRunStepRecorder.fromJson(value).toJson();
}
function stepCount(value) {
    return parseRunSteps(value).length;
}
function toPageActionRunAdminListItem(row) {
    var _a, _b, _c, _d;
    return {
        id: row.id,
        pageActionId: row.pageActionId,
        actionKey: row.pageAction.actionKey,
        pageActionName: row.pageAction.name,
        userId: row.userId,
        username: (_b = (_a = row.user) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : null,
        userEmail: (_d = (_c = row.user) === null || _c === void 0 ? void 0 : _c.email) !== null && _d !== void 0 ? _d : null,
        status: row.status,
        generation: row.generation,
        dslOutcome: row.dslOutcome,
        errorCode: row.errorCode,
        streamId: row.streamId,
        clientActionId: row.clientActionId,
        model: row.model,
        durationMs: row.durationMs,
        stepCount: stepCount(row.steps),
        createdAt: row.createdAt,
        finishedAt: row.finishedAt,
    };
}
exports.toPageActionRunAdminListItem = toPageActionRunAdminListItem;
function toPageActionRunAdminDetail(row) {
    return Object.assign(Object.assign({}, toPageActionRunAdminListItem(row)), { delivery: row.delivery, instruction: row.instruction, context: row.context, pageContext: row.pageContext, fillText: row.fillText, errorMessage: row.errorMessage, promptTokens: row.promptTokens, completionTokens: row.completionTokens, idempotencyKey: row.idempotencyKey, workflowId: row.workflowId, workflowVersion: row.workflowVersion, workflowRun: row.workflowRun, steps: parseRunSteps(row.steps) });
}
exports.toPageActionRunAdminDetail = toPageActionRunAdminDetail;
//# sourceMappingURL=page-action.mapper.js.map