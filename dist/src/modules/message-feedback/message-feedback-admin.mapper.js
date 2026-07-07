"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMessageFeedbackAdminListItems = exports.toMessageFeedbackAdminListItem = void 0;
const message_feedback_constants_1 = require("../message/message-feedback.constants");
const REASON_TAG_LABEL_BY_KEY = new Map(message_feedback_constants_1.MESSAGE_FEEDBACK_DOWN_REASON_TAGS.map((row) => [row.key, row.label]));
const MESSAGE_PREVIEW_MAX = 280;
function previewContent(content) {
    if (content == null) {
        return null;
    }
    const trimmed = content.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.length <= MESSAGE_PREVIEW_MAX) {
        return trimmed;
    }
    return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX)}…`;
}
function reasonTagLabels(tags) {
    return tags.map((key) => { var _a; return (_a = REASON_TAG_LABEL_BY_KEY.get(key)) !== null && _a !== void 0 ? _a : key; });
}
function toMessageFeedbackAdminListItem(row, agentNameById) {
    var _a;
    const reasonTags = Array.isArray(row.reasonTags)
        ? row.reasonTags.filter((item) => typeof item === 'string')
        : [];
    return {
        id: row.id,
        messageId: row.messageId,
        sessionId: row.sessionId,
        userId: row.userId,
        appClientId: row.appClientId,
        turnId: row.turnId,
        agentId: row.agentId,
        agentName: row.agentId != null ? (_a = agentNameById.get(row.agentId)) !== null && _a !== void 0 ? _a : null : null,
        rating: row.rating,
        reasonTags,
        reasonTagLabels: reasonTagLabels(reasonTags),
        comment: row.comment,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        message: {
            id: row.message.id,
            role: row.message.role,
            contentPreview: previewContent(row.message.content),
            createdAt: row.message.createdAt.toISOString(),
        },
        user: {
            id: row.user.id,
            username: row.user.username,
            employeeId: row.user.employeeId,
            email: row.user.email,
        },
        session: {
            id: row.session.id,
            title: row.session.title,
            agentId: row.session.agentId,
        },
    };
}
exports.toMessageFeedbackAdminListItem = toMessageFeedbackAdminListItem;
function toMessageFeedbackAdminListItems(rows, agentNameById) {
    return rows.map((row) => toMessageFeedbackAdminListItem(row, agentNameById));
}
exports.toMessageFeedbackAdminListItems = toMessageFeedbackAdminListItems;
//# sourceMappingURL=message-feedback-admin.mapper.js.map