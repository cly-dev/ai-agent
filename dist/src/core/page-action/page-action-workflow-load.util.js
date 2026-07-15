"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageActionWorkflowLoadErrorCode = exports.pageActionWorkflowLoadFailureMessage = void 0;
function pageActionWorkflowLoadFailureMessage(reason) {
    switch (reason) {
        case 'asset_missing':
            return '关联的工作流不存在或已停用，无法执行 PageAction。';
        case 'revision_missing':
            return 'PageAction 指定的 Workflow 版本不可用，请检查 workflowVersion 配置。';
        case 'empty_nodes':
            return '关联的工作流未配置可执行节点。';
        case 'invalid_edges':
            return '关联的工作流 edges 配置无法解析，请修正后重试。';
        case 'scope_incompatible':
            return '工作流与当前运行范围不兼容，无法执行。';
        default:
            return '工作流加载失败，无法执行 PageAction。';
    }
}
exports.pageActionWorkflowLoadFailureMessage = pageActionWorkflowLoadFailureMessage;
function pageActionWorkflowLoadErrorCode(reason) {
    return `WORKFLOW_LOAD_${reason.toUpperCase()}`;
}
exports.pageActionWorkflowLoadErrorCode = pageActionWorkflowLoadErrorCode;
//# sourceMappingURL=page-action-workflow-load.util.js.map