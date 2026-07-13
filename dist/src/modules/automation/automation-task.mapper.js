"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionRunStatusWhere = exports.toAutomationTaskDetailFromPageActionRun = exports.toAutomationTaskFromPageActionRun = exports.buildAutomationTaskSubtitle = exports.AUTOMATION_PAGE_ACTION_RUN_INCLUDE = void 0;
const page_action_constants_1 = require("../../core/page-action/page-action.constants");
const resolve_page_action_run_output_text_util_1 = require("../../core/page-action/resolve-page-action-run-output-text.util");
const page_action_run_steps_util_1 = require("../../core/page-action/page-action-run-steps.util");
const page_action_task_status_util_1 = require("../../core/page-action/page-action-task-status.util");
const page_context_usage_util_1 = require("../../core/host-bridge/page-context-usage.util");
exports.AUTOMATION_PAGE_ACTION_RUN_INCLUDE = {
    pageAction: {
        select: {
            actionKey: true,
            name: true,
            workflowId: true,
            workflow: { select: { workflowKey: true, name: true } },
        },
    },
    approvalRequest: { select: { id: true, status: true } },
};
function previewText(value, max = 120) {
    const trimmed = value === null || value === void 0 ? void 0 : value.trim();
    if (!trimmed) {
        return null;
    }
    return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}
function isTerminalRunStatus(status) {
    return (status === 'completed' || status === 'failed' || status === 'cancelled');
}
function resolveTaskOutputText(row) {
    return (0, resolve_page_action_run_output_text_util_1.resolvePageActionRunOutputText)({
        fillText: row.fillText,
        errorMessage: row.errorMessage,
        steps: row.steps,
    });
}
function buildTaskOutputs(row, options) {
    const outputText = resolveTaskOutputText(row);
    const includeFullText = (options === null || options === void 0 ? void 0 : options.includeFullText) === true;
    return {
        preview: includeFullText
            ? outputText
            : previewText(outputText),
        fillText: includeFullText ? outputText : null,
        hasFillText: Boolean(outputText),
    };
}
function buildAutomationTaskSubtitle(pageContext) {
    const assessment = (0, page_context_usage_util_1.assessPageContextData)((pageContext !== null && pageContext !== void 0 ? pageContext : null));
    const parts = [];
    if (assessment.page) {
        parts.push(assessment.page);
    }
    if (assessment.entityType && assessment.entityId) {
        parts.push(`${assessment.entityType} ${assessment.entityId}`);
    }
    else if (assessment.entityId) {
        parts.push(`entity ${assessment.entityId}`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
}
exports.buildAutomationTaskSubtitle = buildAutomationTaskSubtitle;
function toTimeline(steps) {
    return (0, page_action_run_steps_util_1.toPublicPageActionRunTimeline)(steps);
}
function toAutomationTaskFromPageActionRun(row) {
    var _a, _b, _c, _d;
    const workflow = row.pageAction.workflow;
    const outcome = (0, page_action_task_status_util_1.resolvePageActionRunOutcome)({
        status: row.status,
        errorCode: row.errorCode,
    });
    return {
        ref: { kind: 'page_action_run', id: row.id },
        triggerSource: 'page_action',
        taskStatus: outcome.taskStatus,
        succeeded: outcome.succeeded,
        title: row.pageAction.name,
        subtitle: buildAutomationTaskSubtitle(row.pageContext),
        pageActionKey: row.pageActionKey,
        workflowKey: (_a = workflow === null || workflow === void 0 ? void 0 : workflow.workflowKey) !== null && _a !== void 0 ? _a : null,
        workflowName: (_b = workflow === null || workflow === void 0 ? void 0 : workflow.name) !== null && _b !== void 0 ? _b : null,
        createdAt: row.createdAt.toISOString(),
        finishedAt: (_d = (_c = row.finishedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
        durationMs: row.durationMs,
        errorCode: row.errorCode,
        errorMessage: row.errorMessage,
        approval: row.approvalRequest
            ? { id: row.approvalRequest.id, status: row.approvalRequest.status }
            : null,
        outputs: buildTaskOutputs(row, {
            includeFullText: isTerminalRunStatus(row.status),
        }),
    };
}
exports.toAutomationTaskFromPageActionRun = toAutomationTaskFromPageActionRun;
function toAutomationTaskDetailFromPageActionRun(row) {
    const listItem = toAutomationTaskFromPageActionRun(row);
    const fillText = resolveTaskOutputText(row);
    return Object.assign(Object.assign({}, listItem), { outputs: Object.assign(Object.assign({}, listItem.outputs), { preview: fillText, fillText, hasFillText: Boolean(fillText) }), actionKey: row.pageAction.actionKey, instruction: row.instruction, errorCode: row.errorCode, errorMessage: row.errorMessage, streamUrl: (0, page_action_constants_1.buildPageActionRunStreamPath)(row.id), timeline: toTimeline(row.steps), workflowRun: row.workflowRun });
}
exports.toAutomationTaskDetailFromPageActionRun = toAutomationTaskDetailFromPageActionRun;
function resolvePageActionRunStatusWhere(status) {
    if (!status || status === 'all') {
        return undefined;
    }
    if (status === 'active') {
        return { in: ['running', 'awaiting_approval'] };
    }
    return status;
}
exports.resolvePageActionRunStatusWhere = resolvePageActionRunStatusWhere;
//# sourceMappingURL=automation-task.mapper.js.map