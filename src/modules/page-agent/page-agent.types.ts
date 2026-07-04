import type { Prisma } from '../../../generated/prisma/client';

export const PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE = {
  appClient: { select: { id: true, name: true, dsn: true } },
  user: { select: { id: true, username: true, email: true } },
  modelConfig: { select: { id: true, provider: true, model: true } },
} satisfies Prisma.PageAgentLlmProxyAuditInclude;

export type PageAgentLlmProxyAuditRow = Prisma.PageAgentLlmProxyAuditGetPayload<{
  include: typeof PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE;
}>;

export type PageAgentLlmProxyAuditListItem = {
  id: number;
  appClientId: number;
  appClientName: string | null;
  userId: number;
  username: string | null;
  userEmail: string | null;
  modelConfigId: number | null;
  requestedModel: string | null;
  provider: string | null;
  providerModel: string | null;
  status: string;
  upstreamStatus: number | null;
  durationMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  createdAt: Date;
  finishedAt: Date | null;
};

export type PageAgentLlmProxyAuditDetail =
  PageAgentLlmProxyAuditListItem & {
    requestMeta: unknown | null;
    errorMessage: string | null;
  };
