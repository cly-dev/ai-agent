-- App 默认共享能力：Agent restrict* 字段、Skill.appClientId、恢复 AgentSkill。

ALTER TABLE "Agent" ADD COLUMN "restrictTools" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN "restrictHostTools" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN "restrictSkills" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Skill" ADD COLUMN "appClientId" INTEGER;

UPDATE "Skill" s
SET "appClientId" = a."appClientId"
FROM "Agent" a
WHERE s."agentId" = a.id AND s."appClientId" IS NULL;

DELETE FROM "Skill" WHERE "appClientId" IS NULL;

ALTER TABLE "Skill" ALTER COLUMN "appClientId" SET NOT NULL;

CREATE TABLE "AgentSkill" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    CONSTRAINT "AgentSkill_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AgentSkill" ("agentId", "skillId")
SELECT s."agentId", s.id
FROM "Skill" s
WHERE s."agentId" IS NOT NULL;

UPDATE "Agent" a
SET "restrictTools" = true
WHERE EXISTS (SELECT 1 FROM "AgentTool" at WHERE at."agentId" = a.id);

UPDATE "Agent" a
SET "restrictHostTools" = true
WHERE EXISTS (SELECT 1 FROM "AgentHostTool" aht WHERE aht."agentId" = a.id);

UPDATE "Agent" a
SET "restrictSkills" = true
WHERE EXISTS (SELECT 1 FROM "AgentSkill" ags WHERE ags."agentId" = a.id);

ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_agentId_fkey";
DROP INDEX IF EXISTS "Skill_agentId_name_key";
DROP INDEX IF EXISTS "Skill_agentId_capabilityKey_key";
DROP INDEX IF EXISTS "Skill_agentId_isActive_idx";
ALTER TABLE "Skill" DROP COLUMN "agentId";

CREATE UNIQUE INDEX "Skill_appClientId_name_key" ON "Skill"("appClientId", "name");
CREATE UNIQUE INDEX "Skill_appClientId_capabilityKey_key" ON "Skill"("appClientId", "capabilityKey");
CREATE INDEX "Skill_appClientId_isActive_idx" ON "Skill"("appClientId", "isActive");

CREATE UNIQUE INDEX "AgentSkill_agentId_skillId_key" ON "AgentSkill"("agentId", "skillId");
CREATE INDEX "AgentSkill_agentId_idx" ON "AgentSkill"("agentId");
CREATE INDEX "AgentSkill_skillId_idx" ON "AgentSkill"("skillId");

ALTER TABLE "Skill" ADD CONSTRAINT "Skill_appClientId_fkey"
  FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
