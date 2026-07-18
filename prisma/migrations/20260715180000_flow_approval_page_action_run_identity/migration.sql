-- PageActionRun / ApprovalRequest：区分 Flow 与 legacy Workflow 资产 ID，禁止把 flowId 写入 Workflow FK。

ALTER TABLE "PageActionRun" ADD COLUMN IF NOT EXISTS "flowId" INTEGER;
ALTER TABLE "PageActionRun" ADD COLUMN IF NOT EXISTS "flowVersion" INTEGER;
CREATE INDEX IF NOT EXISTS "PageActionRun_flowId_idx" ON "PageActionRun"("flowId");
DO $$ BEGIN
  ALTER TABLE "PageActionRun" ADD CONSTRAINT "PageActionRun_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ApprovalRequest" ADD COLUMN IF NOT EXISTS "flowId" INTEGER;
ALTER TABLE "ApprovalRequest" ADD COLUMN IF NOT EXISTS "flowVersion" INTEGER;
ALTER TABLE "ApprovalRequest" ALTER COLUMN "workflowId" DROP NOT NULL;
ALTER TABLE "ApprovalRequest" ALTER COLUMN "workflowVersion" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "ApprovalRequest_flowId_idx" ON "ApprovalRequest"("flowId");
DO $$ BEGIN
  ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
