-- Scope idempotency per (appClient, user, pageAction); allow same key across actions/users.
DROP INDEX IF EXISTS "PageActionRun_appClientId_idempotencyKey_completed_key";
DROP INDEX IF EXISTS "PageActionRun_appClientId_idempotencyKey_running_key";

CREATE UNIQUE INDEX "PageActionRun_idempotency_completed_key"
ON "PageActionRun"("appClientId", "userId", "pageActionId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "status" = 'completed';

CREATE UNIQUE INDEX "PageActionRun_idempotency_running_key"
ON "PageActionRun"("appClientId", "userId", "pageActionId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "status" = 'running';
