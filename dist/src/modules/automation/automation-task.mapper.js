"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionRunStatusWhere = exports.toAutomationTaskDetailFromPageActionRun = exports.toAutomationTaskFromPageActionRun = exports.buildAutomationTaskSubtitle = exports.AUTOMATION_PAGE_ACTION_RUN_INCLUDE = void 0;
const page_action_constants_1 = require("../../core/page-action/page-action.constants");
const page_action_run_steps_util_1 = require("../../core/page-action/page-action-run-steps.util");
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
function mapRunStatus(status) {
    switch (status) {
        case 'running':
            return 'running';
        case 'awaiting_approval':
            return 'awaiting_approval';
        case 'completed':
            return 'completed';
        case 'failed':
            return 'failed';
        case 'cancelled':
            return 'cancelled';
        default:
            return 'failed';
    }
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
    var _a, _b, _c, _d, _e;
    const workflow = row.pageAction.workflow;
    return {
        ref: { kind: 'page_action_run', id: row.id },
        triggerSource: 'page_action',
        taskStatus: mapRunStatus(row.status),
        title: row.pageAction.name,
        subtitle: buildAutomationTaskSubtitle(row.pageContext),
        pageActionKey: row.pageActionKey,
        workflowKey: (_a = workflow === null || workflow === void 0 ? void 0 : workflow.workflowKey) !== null && _a !== void 0 ? _a : null,
        workflowName: (_b = workflow === null || workflow === void 0 ? void 0 : workflow.name) !== null && _b !== void 0 ? _b : null,
        createdAt: row.createdAt.toISOString(),
        finishedAt: (_d = (_c = row.finishedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
        durationMs: row.durationMs,
        approval: row.approvalRequest
            ? { id: row.approvalRequest.id, status: row.approvalRequest.status }
            : null,
        outputs: {
            preview: previewText(row.fillText),
            hasFillText: Boolean((_e = row.fillText) === null || _e === void 0 ? void 0 : _e.trim()),
        },
    };
}
exports.toAutomationTaskFromPageActionRun = toAutomationTaskFromPageActionRun;
function toAutomationTaskDetailFromPageActionRun(row) {
    var _a;
    const listItem = toAutomationTaskFromPageActionRun(row);
    const fillText = ((_a = row.fillText) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    return Object.assign(Object.assign({}, listItem), { outputs: Object.assign(Object.assign({}, listItem.outputs), { fillText }), actionKey: row.pageAction.actionKey, instruction: row.instruction, errorCode: row.errorCode, errorMessage: row.errorMessage, streamUrl: (0, page_action_constants_1.buildPageActionRunStreamPath)(row.id), timeline: toTimeline(row.steps), workflowRun: row.workflowRun });
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