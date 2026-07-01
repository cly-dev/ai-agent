-- Workflow 审批卡点：统一 ApprovalRequest 实体 + PageActionRun 挂起态。
-- 触发权限复用 RoleTool（write_data.toolId），不新增授权表。

-- PageActionRun 新增挂起状态
ALTER TYPE "PageActionRunStatus" ADD VALUE IF NOT EXISTS 'awaiting_approval' BEFORE 'completed';

-- 审批来源 / 状态枚举
CREATE TYPE "ApprovalSource" AS ENUM ('chat', 'page_action', 'webhook');
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'cancelled');

-- 统一审批请求 SSOT
CREATE TABLE "ApprovalRequest" (
    "id" SERIAL NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "source" "ApprovalSource" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "initiatorUserId" INTEGER,
    "approverUserId" INTEGER NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "workflowVersion" INTEGER NOT NULL,
    "nodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "previewBlocks" JSONB,
    "resumeSnapshot" JSONB NOT NULL,
    "pageActionRunId" INTEGER,
    "sessionId" TEXT,
    "idempotencyKey" TEXT,
    "decidedByUserId" INTEGER,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApprovalRequest_pageActionRunId_key" ON "ApprovalRequest"("pageActionRunId");
CREATE INDEX "ApprovalRequest_appClientId_approverUserId_status_createdAt_idx" ON "ApprovalRequest"("appClientId", "approverUserId", "status", "createdAt");
CREATE INDEX "ApprovalRequest_appClientId_status_idx" ON "ApprovalRequest"("appClientId", "status");
CREATE INDEX "ApprovalRequest_workflowId_idx" ON "ApprovalRequest"("workflowId");

ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_appClientId_fkey"
  FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_initiatorUserId_fkey"
  FOREIGN KEY ("initiatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approverUserId_fkey"
  FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_pageActionRunId_fkey"
  FOREIGN KEY ("pageActionRunId") REFERENCES "PageActionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
