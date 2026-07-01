-- 幂等键：同一 App 下最多一条 running、一条 completed（failed/cancelled 不占用，可重试）
DROP INDEX IF EXISTS "PageActionRun_appClientId_idempotencyKey_idx";

CREATE UNIQUE INDEX "PageActionRun_appClientId_idempotencyKey_completed_key"
ON "PageActionRun"("appClientId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "status" = 'completed';

CREATE UNIQUE INDEX "PageActionRun_appClientId_idempotencyKey_running_key"
ON "PageActionRun"("appClientId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "status" = 'running';

CREATE INDEX "PageActionRun_appClientId_idempotencyKey_idx"
ON "PageActionRun"("appClientId", "idempotencyKey");
