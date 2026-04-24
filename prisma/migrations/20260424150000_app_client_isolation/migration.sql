-- AppClient multi-tenant isolation: Agent, Tool, Session, AgentRun, Integration

ALTER TABLE "Agent" ADD COLUMN "appClientId" INTEGER;
ALTER TABLE "Tool" ADD COLUMN "appClientId" INTEGER;
ALTER TABLE "Session" ADD COLUMN "appClientId" INTEGER;
ALTER TABLE "AgentRun" ADD COLUMN "appClientId" INTEGER;
ALTER TABLE "Integration" ADD COLUMN "appClientId" INTEGER;

INSERT INTO "AppClient" ("name", "dsn", "isActive", "createdAt", "updatedAt")
SELECT 'Default', 'default', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AppClient" LIMIT 1);

UPDATE "Agent" SET "appClientId" = (SELECT "id" FROM "AppClient" ORDER BY "id" ASC LIMIT 1) WHERE "appClientId" IS NULL;
UPDATE "Tool" SET "appClientId" = (SELECT "id" FROM "AppClient" ORDER BY "id" ASC LIMIT 1) WHERE "appClientId" IS NULL;
UPDATE "Session" SET "appClientId" = (SELECT "id" FROM "AppClient" ORDER BY "id" ASC LIMIT 1) WHERE "appClientId" IS NULL;
UPDATE "AgentRun" SET "appClientId" = (SELECT "id" FROM "AppClient" ORDER BY "id" ASC LIMIT 1) WHERE "appClientId" IS NULL;
UPDATE "Integration" SET "appClientId" = (SELECT "id" FROM "AppClient" ORDER BY "id" ASC LIMIT 1) WHERE "appClientId" IS NULL;

ALTER TABLE "Agent" ALTER COLUMN "appClientId" SET NOT NULL;
ALTER TABLE "Tool" ALTER COLUMN "appClientId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "appClientId" SET NOT NULL;
ALTER TABLE "AgentRun" ALTER COLUMN "appClientId" SET NOT NULL;
ALTER TABLE "Integration" ALTER COLUMN "appClientId" SET NOT NULL;

ALTER TABLE "Agent" ADD CONSTRAINT "Agent_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Agent_appClientId_idx" ON "Agent"("appClientId");
CREATE INDEX "Tool_appClientId_idx" ON "Tool"("appClientId");
CREATE INDEX "Session_appClientId_idx" ON "Session"("appClientId");
CREATE INDEX "AgentRun_appClientId_idx" ON "AgentRun"("appClientId");
CREATE INDEX "Integration_appClientId_idx" ON "Integration"("appClientId");
