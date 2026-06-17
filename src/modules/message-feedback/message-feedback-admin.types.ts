import type { Prisma } from '../../../generated/prisma/client';

export const MESSAGE_FEEDBACK_ADMIN_INCLUDE = {
  message: {
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      employeeId: true,
      email: true,
    },
  },
  session: {
    select: {
      id: true,
      title: true,
      agentId: true,
    },
  },
} satisfies Prisma.MessageFeedbackInclude;

export type MessageFeedbackAdminRow = Prisma.MessageFeedbackGetPayload<{
  include: typeof MESSAGE_FEEDBACK_ADMIN_INCLUDE;
}>;

export type MessageFeedbackReasonTagView = {
  key: string;
  label: string;
};

export type MessageFeedbackAdminListItem = {
  id: number;
  messageId: number;
  sessionId: string;
  userId: number;
  appClientId: number;
  turnId: number | null;
  agentId: number | null;
  agentName: string | null;
  rating: 'up' | 'down';
  reasonTags: string[];
  reasonTagLabels: string[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  message: {
    id: number;
    role: string;
    contentPreview: string | null;
    createdAt: string;
  };
  user: {
    id: number;
    username: string;
    employeeId: string;
    email: string;
  };
  session: {
    id: string;
    title: string | null;
    agentId: number | null;
  };
};

export type MessageFeedbackAdminSummary = {
  windowDays: number;
  from: string;
  to: string;
  totals: {
    feedback: number;
    up: number;
    down: number;
    upRate: number;
  };
  downReasonTagCounts: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  downByAgent: Array<{
    agentId: number;
    agentName: string;
    downCount: number;
  }>;
};
