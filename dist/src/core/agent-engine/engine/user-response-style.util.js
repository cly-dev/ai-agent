"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifySummarizeScenario = exports.isLikelyReadOnlyQuestion = exports.isLikelyWriteOperation = exports.isUserRequestingFullDetail = void 0;
const FULL_DETAIL_HINTS = [
    '全部',
    '全量',
    '完整',
    '详细',
    '详情',
    '所有字段',
    '全部字段',
    '每一项',
    '不要省略',
    '别省略',
    '信息要全',
    '尽量全',
    'full detail',
    'all fields',
    'complete info',
];
function isUserRequestingFullDetail(userMessage) {
    const text = userMessage.trim().toLowerCase();
    if (!text) {
        return false;
    }
    return FULL_DETAIL_HINTS.some((hint) => text.includes(hint.toLowerCase()));
}
exports.isUserRequestingFullDetail = isUserRequestingFullDetail;
const WRITE_OPERATION_HINTS = [
    '修改',
    '更新',
    '创建',
    '新增',
    '删除',
    '批量',
    '上架',
    '下架',
    '回滚',
    '提交',
    '保存',
    '启用',
    '禁用',
    'set',
    'update',
    'create',
    'delete',
    'rollback',
    'post',
    'put',
    'patch',
];
const READ_OPERATION_HINTS = [
    '查',
    '查询',
    '详情',
    '信息',
    '库存',
    '状态',
    '多少',
    '是什么',
    '列表',
    'get',
    'detail',
    'status',
    'inventory',
    'search',
    'find',
];
function isLikelyWriteOperation(userMessage) {
    const text = userMessage.trim().toLowerCase();
    if (!text) {
        return false;
    }
    return WRITE_OPERATION_HINTS.some((hint) => text.includes(hint));
}
exports.isLikelyWriteOperation = isLikelyWriteOperation;
function isLikelyReadOnlyQuestion(userMessage) {
    const text = userMessage.trim().toLowerCase();
    if (!text) {
        return false;
    }
    if (isLikelyWriteOperation(userMessage)) {
        return false;
    }
    return READ_OPERATION_HINTS.some((hint) => text.includes(hint));
}
exports.isLikelyReadOnlyQuestion = isLikelyReadOnlyQuestion;
function classifySummarizeScenario(userMessage) {
    if (isLikelyWriteOperation(userMessage)) {
        return 'action';
    }
    return 'read';
}
exports.classifySummarizeScenario = classifySummarizeScenario;
//# sourceMappingURL=user-response-style.util.js.map