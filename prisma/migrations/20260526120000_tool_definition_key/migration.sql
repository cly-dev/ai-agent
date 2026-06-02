-- AlterTable: Tool.definitionKey（先可空 → 回填 → NOT NULL → 唯一）
ALTER TABLE "Tool" ADD COLUMN "definitionKey" TEXT;

UPDATE "Tool" SET "definitionKey" = 'legacy_' || "id"::text WHERE "definitionKey" IS NULL;

ALTER TABLE "Tool" ALTER COLUMN "definitionKey" SET NOT NULL;

CREATE UNIQUE INDEX "Tool_appClientId_definitionKey_key" ON "Tool"("appClientId", "definitionKey");

CREATE INDEX "Tool_definitionKey_idx" ON "Tool"("definitionKey");
