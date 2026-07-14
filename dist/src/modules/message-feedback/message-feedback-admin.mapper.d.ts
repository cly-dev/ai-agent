import type { MessageFeedbackAdminListItem, MessageFeedbackAdminRow } from './message-feedback-admin.types';
export declare function toMessageFeedbackAdminListItem(row: MessageFeedbackAdminRow, agentNameById: ReadonlyMap<number, string>): MessageFeedbackAdminListItem;
export declare function toMessageFeedbackAdminListItems(rows: MessageFeedbackAdminRow[], agentNameById: ReadonlyMap<number, string>): MessageFeedbackAdminListItem[];
