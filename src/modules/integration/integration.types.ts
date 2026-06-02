import type { Prisma } from '../../../generated/prisma/client';

export const INTEGRATION_DETAIL_INCLUDE = {
  _count: {
    select: {
      tools: true,
    },
  },
} satisfies Prisma.IntegrationInclude;

export type IntegrationDetailRow = Prisma.IntegrationGetPayload<{
  include: typeof INTEGRATION_DETAIL_INCLUDE;
}>;

export type IntegrationResponse = IntegrationDetailRow & {
  systemConfigured: boolean;
  toolCount: number;
};

export type IntegrationConnectionTestResult = {
  reachable: boolean;
  url: string;
  method: 'GET' | 'HEAD';
  statusCode?: number;
  statusText?: string;
  durationMs: number;
  error?: string;
};
