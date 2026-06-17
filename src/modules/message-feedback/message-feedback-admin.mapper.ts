import { MESSAGE_FEEDBACK_DOWN_REASON_TAGS } from '../message/message-feedback.constants';
import type {
  MessageFeedbackAdminListItem,
  MessageFeedbackAdminRow,
} from './message-feedback-admin.types';

const REASON_TAG_LABEL_BY_KEY = new Map<string, string>(
  MESSAGE_FEEDBACK_DOWN_REASON_TAGS.map((row) => [row.key, row.label]),
);

const MESSAGE_PREVIEW_MAX = 280;

function previewContent(content: string | null | undefined): string | null {
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

function reasonTagLabels(tags: string[]): string[] {
  return tags.map((key) => REASON_TAG_LABEL_BY_KEY.get(key) ?? key);
}

export function toMessageFeedbackAdminListItem(
  row: MessageFeedbackAdminRow,
  agentNameById: ReadonlyMap<number, string>,
): MessageFeedbackAdminListItem {
  const reasonTags = Array.isArray(row.reasonTags)
    ? row.reasonTags.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    id: row.id,
    messageId: row.messageId,
    sessionId: row.sessionId,
    userId: row.userId,
    appClientId: row.appClientId,
    turnId: row.turnId,
    agentId: row.agentId,
    agentName:
      row.agentId != null ? agentNameById.get(row.agentId) ?? null : null,
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

export function toMessageFeedbackAdminListItems(
  rows: MessageFeedbackAdminRow[],
  agentNameById: ReadonlyMap<number, string>,
): MessageFeedbackAdminListItem[] {
  return rows.map((row) => toMessageFeedbackAdminListItem(row, agentNameById));
}
