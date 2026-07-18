"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPageActionRunAdminDetail = exports.toPageActionRunAdminListItem = exports.toPageActionResponse = void 0;
const page_action_run_steps_util_1 = require("../../core/page-action/page-action-run-steps.util");
const page_action_task_status_util_1 = require("../../core/page-action/page-action-task-status.util");
function toPageActionResponse(row) {
    var _a, _b, _c;
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: (_a = row.appClient) === null || _a === void 0 ? void 0 : _a.name,
        actionKey: row.actionKey,
        name: row.name,
        description: row.description,
        hostToolId: row.hostToolId,
        hostToolName: (_c = (_b = row.hostTool) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : null,
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
        flowId: row.flowId,
        flowVersion: row.flowVersion,
        workflowOverrides: row.workflowOverrides,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
exports.toPageActionResponse = toPageActionResponse;
function parseRunSteps(value) {
    return (0, page_action_run_steps_util_1.parsePageActionRunSteps)(value);
}
function stepCount(value) {
    return parseRunSteps(value).length;
}
function toPageActionRunAdminListItem(row) {
    var _a, _b, _c, _d;
    const outcome = (0, page_action_task_status_util_1.resolvePageActionRunOutcome)({
        status: row.status,
        errorCode: row.errorCode,
    });
    return {
        id: row.id,
        pageActionId: row.pageActionId,
        actionKey: row.pageAction.actionKey,
        pageActionName: row.pageAction.name,
        userId: row.userId,
        username: (_b = (_a = row.user) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : null,
        userEmail: (_d = (_c = row.user) === null || _c === void 0 ? void 0 : _c.email) !== null && _d !== void 0 ? _d : null,
        status: row.status,
        taskStatus: outcome.taskStatus,
        succeeded: outcome.succeeded,
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
    return Object.assign(Object.assign({}, toPageActionRunAdminListItem(row)), { delivery: row.delivery, instruction: row.instruction, context: row.context, pageContext: row.pageContext, fillText: row.fillText, errorMessage: row.errorMessage, promptTokens: row.promptTokens, completionTokens: row.completionTokens, idempotencyKey: row.idempotencyKey, workflowId: row.workflowId, workflowVersion: row.workflowVersion, flowId: row.flowId, flowVersion: row.flowVersion, workflowRun: row.workflowRun, steps: parseRunSteps(row.steps) });
}
exports.toPageActionRunAdminDetail = toPageActionRunAdminDetail;
//# sourceMappingURL=page-action.mapper.js.map