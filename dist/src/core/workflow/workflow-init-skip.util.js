"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkflowInitSkippedPendingRespond = exports.guidanceForWorkflowInitSkippedReadinessReason = exports.buildWorkflowInitSkippedGuidance = exports.isWorkflowInitSkipReason = exports.latestWorkflowInitSkipReason = exports.hasWorkflowInitSkippedStep = void 0;
function hasWorkflowInitSkippedStep(steps) {
    return (steps !== null && steps !== void 0 ? steps : []).some((row) => row.name === 'workflow_init_skipped');
}
exports.hasWorkflowInitSkippedStep = hasWorkflowInitSkippedStep;
function latestWorkflowInitSkipReason(steps) {
    const row = [...(steps !== null && steps !== void 0 ? steps : [])]
        .reverse()
        .find((step) => step.name === 'workflow_init_skipped');
    if (!(row === null || row === void 0 ? void 0 : row.output) || typeof row.output !== 'object' || Array.isArray(row.output)) {
        return null;
    }
    const reason = row.output.reason;
    return isWorkflowInitSkipReason(reason) ? reason : null;
}
exports.latestWorkflowInitSkipReason = latestWorkflowInitSkipReason;
function isWorkflowInitSkipReason(value) {
    return (value === 'no_task_plan' ||
        value === 'resume_defs_mismatch' ||
        value === 'db_load_failed' ||
        value === 'compile_empty' ||
        value === 'scope_mismatch' ||
        value === 'trigger_permission_denied');
}
exports.isWorkflowInitSkipReason = isWorkflowInitSkipReason;
function buildWorkflowInitSkippedGuidance(reason) {
    switch (reason) {
        case 'db_load_failed':
            return '关联的工作流配置不可用或已失效，暂无法按预设流程执行。请检查技能与工作流配置，或取消技能选择后重试。';
        case 'resume_defs_mismatch':
            return '会话恢复时工作流定义与当前配置不一致，无法继续执行。请重新开始本轮操作。';
        case 'compile_empty':
            return '当前任务无法生成可执行的步骤计划，暂无法继续处理。请补充更具体的需求后重试。';
        case 'scope_mismatch':
            return '当前可用工具范围无法覆盖工作流所需步骤，暂无法执行。请调整页面上下文或技能选择后重试。';
        case 'trigger_permission_denied':
            return '当前账号缺少工作流写操作所需工具权限，暂无法启动该流程。请联系管理员开通权限后重试。';
        case 'no_task_plan':
            return '请先描述你的问题或希望完成的操作。';
        default:
            return '当前请求暂无法按工作流执行，请补充说明或调整技能选择后重试。';
    }
}
exports.buildWorkflowInitSkippedGuidance = buildWorkflowInitSkippedGuidance;
function guidanceForWorkflowInitSkippedReadinessReason(readinessReason) {
    const prefix = 'workflow_init_skipped:';
    if (!(readinessReason === null || readinessReason === void 0 ? void 0 : readinessReason.startsWith(prefix))) {
        return null;
    }
    const reason = readinessReason.slice(prefix.length);
    return isWorkflowInitSkipReason(reason)
        ? buildWorkflowInitSkippedGuidance(reason)
        : null;
}
exports.guidanceForWorkflowInitSkippedReadinessReason = guidanceForWorkflowInitSkippedReadinessReason;
function buildWorkflowInitSkippedPendingRespond(input) {
    const userMessage = input.userMessage.trim() || '请补充说明你的需求。';
    switch (input.reason) {
        case 'scope_mismatch':
        case 'trigger_permission_denied':
        case 'db_load_failed':
        case 'compile_empty':
        case 'resume_defs_mismatch':
            return {
                mode: 'turn',
                request: {
                    kind: 'unsupported_scope',
                    userMessage,
                    payload: {
                        readinessReason: `workflow_init_skipped:${input.reason}`,
                    },
                },
            };
        case 'no_task_plan':
            return {
                mode: 'turn',
                request: {
                    kind: 'message_unclear',
                    userMessage,
                    payload: {
                        readinessReason: 'workflow_init_skipped:no_task_plan',
                    },
                },
            };
        default:
            return null;
    }
}
exports.buildWorkflowInitSkippedPendingRespond = buildWorkflowInitSkippedPendingRespond;
//# sourceMappingURL=workflow-init-skip.util.js.map