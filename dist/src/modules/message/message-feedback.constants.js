"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDownReasonTags = exports.isAllowedDownReasonTagKey = exports.MESSAGE_FEEDBACK_DOWN_REASON_TAGS = void 0;
exports.MESSAGE_FEEDBACK_DOWN_REASON_TAGS = [
    { key: 'factual_error', label: '事实错误或胡编' },
    { key: 'misunderstood', label: '没理解我的需求' },
    { key: 'incomplete', label: '回答不完整' },
    { key: 'wrong_tool', label: '工具或数据用错了' },
    { key: 'format_bad', label: '格式难读或展示有问题' },
    { key: 'other', label: '其他' },
];
const ALLOWED_DOWN_REASON_TAG_KEYS = new Set(exports.MESSAGE_FEEDBACK_DOWN_REASON_TAGS.map((row) => row.key));
function isAllowedDownReasonTagKey(key) {
    return ALLOWED_DOWN_REASON_TAG_KEYS.has(key);
}
exports.isAllowedDownReasonTagKey = isAllowedDownReasonTagKey;
function normalizeDownReasonTags(tags) {
    if (!(tags === null || tags === void 0 ? void 0 : tags.length)) {
        return [];
    }
    const seen = new Set();
    const normalized = [];
    for (const raw of tags) {
        const key = raw.trim();
        if (!key || seen.has(key)) {
            continue;
        }
        seen.add(key);
        normalized.push(key);
    }
    return normalized;
}
exports.normalizeDownReasonTags = normalizeDownReasonTags;
//# sourceMappingURL=message-feedback.constants.js.map