import type {
  PageAgentLlmProxyAuditDetail,
  PageAgentLlmProxyAuditListItem,
  PageAgentLlmProxyAuditRow,
} from './page-agent.types';

export function toPageAgentLlmProxyAuditListItem(
  row: PageAgentLlmProxyAuditRow,
): PageAgentLlmProxyAuditListItem {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient?.name ?? null,
    userId: row.userId,
    username: row.user?.username ?? null,
    userEmail: row.user?.email ?? null,
    modelConfigId: row.modelConfigId,
    requestedModel: row.requestedModel,
    provider: row.provider,
    providerModel: row.providerModel,
    status: row.status,
    upstreamStatus: row.upstreamStatus,
    durationMs: row.durationMs,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    totalTokens: row.totalTokens,
    createdAt: row.createdAt,
    finishedAt: row.finishedAt,
  };
}

export function toPageAgentLlmProxyAuditDetail(
  row: PageAgentLlmProxyAuditRow,
): PageAgentLlmProxyAuditDetail {
  return {
    ...toPageAgentLlmProxyAuditListItem(row),
    requestMeta: row.requestMeta,
    errorMessage: row.errorMessage,
  };
}
