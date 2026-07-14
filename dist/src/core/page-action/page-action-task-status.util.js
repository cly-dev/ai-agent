"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionRunOutcome = exports.mapPageActionRunStatusToTaskStatus = void 0;
function mapPageActionRunStatusToTaskStatus(status) {
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
exports.mapPageActionRunStatusToTaskStatus = mapPageActionRunStatusToTaskStatus;
function resolvePageActionRunOutcome(input) {
    var _a;
    const taskStatus = mapPageActionRunStatusToTaskStatus(input.status);
    return {
        taskStatus,
        succeeded: input.status === 'completed' && !((_a = input.errorCode) === null || _a === void 0 ? void 0 : _a.trim()),
    };
}
exports.resolvePageActionRunOutcome = resolvePageActionRunOutcome;
//# sourceMappingURL=page-action-task-status.util.js.map