-- PageAgent C 端 LLM 代理调用审计（不保存完整 messages）
CREATE TABLE "PageAgentLlmProxyAudit" (
  "id" SERIAL NOT NULL,
  "appClientId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "modelConfigId" INTEGER,
  "requestedModel" TEXT,
  "provider" TEXT,
  "providerModel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'running',
  "upstreamStatus" INTEGER,
  "durationMs" INTEGER,
  "promptTokens" INTEGER,
  "completionTokens" INTEGER,
  "totalTokens" INTEGER,
  "requestMeta" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),

  CONSTRAINT "PageAgentLlmProxyAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageAgentLlmProxyAudit_appClientId_createdAt_idx"
  ON "PageAgentLlmProxyAudit"("appClientId", "createdAt");
CREATE INDEX "PageAgentLlmProxyAudit_userId_createdAt_idx"
  ON "PageAgentLlmProxyAudit"("userId", "createdAt");
CREATE INDEX "PageAgentLlmProxyAudit_status_createdAt_idx"
  ON "PageAgentLlmProxyAudit"("status", "createdAt");
CREATE INDEX "PageAgentLlmProxyAudit_modelConfigId_idx"
  ON "PageAgentLlmProxyAudit"("modelConfigId");

ALTER TABLE "PageAgentLlmProxyAudit"
  ADD CONSTRAINT "PageAgentLlmProxyAudit_appClientId_fkey"
  FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PageAgentLlmProxyAudit"
  ADD CONSTRAINT "PageAgentLlmProxyAudit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PageAgentLlmProxyAudit"
  ADD CONSTRAINT "PageAgentLlmProxyAudit_modelConfigId_fkey"
  FOREIGN KEY ("modelConfigId") REFERENCES "LlmModelConfig"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
