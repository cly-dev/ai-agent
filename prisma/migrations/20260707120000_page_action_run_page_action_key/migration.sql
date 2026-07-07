-- PageAction invoke dedupe: same user + pageAction + pageActionKey cannot run concurrently.
ALTER TABLE "PageActionRun" ADD COLUMN "pageActionKey" TEXT;

CREATE INDEX "PageActionRun_pageActionId_userId_pageActionKey_idx"
ON "PageActionRun"("pageActionId", "userId", "pageActionKey");

CREATE UNIQUE INDEX "PageActionRun_page_action_key_active_key"
ON "PageActionRun"("pageActionId", "userId", "pageActionKey")
WHERE "pageActionKey" IS NOT NULL AND "status" IN ('running', 'awaiting_approval');
