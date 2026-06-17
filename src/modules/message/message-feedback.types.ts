export type MessageFeedbackRating = 'up' | 'down';

export type MessageFeedbackDownReasonTag = {
  key: string;
  label: string;
};

export type MessageFeedbackView = {
  messageId: number;
  rating: MessageFeedbackRating;
  reasonTags: string[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageFeedbackBatchResponse = {
  items: MessageFeedbackView[];
};
