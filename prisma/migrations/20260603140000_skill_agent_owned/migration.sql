-- Skill 归属 Agent；移除 appClientId 与 AgentSkill 中间表。

ALTER TABLE "Skill" ADD COLUMN "agentId" INTEGER;
ALTER TABLE "Skill" ADD COLUMN "capabilityKey" TEXT;

UPDATE "Skill" s
SET "agentId" = sub."agentId"
FROM (
  SELECT DISTINCT ON (asg."skillId") asg."skillId", asg."agentId"
  FROM "AgentSkill" asg
  ORDER BY asg."skillId", asg."agentId"
) sub
WHERE s.id = sub."skillId" AND s."agentId" IS NULL;

UPDATE "Skill" s
SET "agentId" = sub."agentId"
FROM (
  SELECT a."appClientId", MIN(a.id) AS "agentId"
  FROM "Agent" a
  GROUP BY a."appClientId"
) sub
WHERE s."appClientId" = sub."appClientId" AND s."agentId" IS NULL;

DELETE FROM "Skill" WHERE "agentId" IS NULL;

ALTER TABLE "Skill" ALTER COLUMN "agentId" SET NOT NULL;

DROP TABLE IF EXISTS "AgentSkill";

ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_appClientId_fkey";
DROP INDEX IF EXISTS "Skill_appClientId_name_key";
DROP INDEX IF EXISTS "Skill_appClientId_isActive_idx";
ALTER TABLE "Skill" DROP COLUMN IF EXISTS "appClientId";

CREATE UNIQUE INDEX "Skill_agentId_name_key" ON "Skill"("agentId", "name");
CREATE UNIQUE INDEX "Skill_agentId_capabilityKey_key" ON "Skill"("agentId", "capabilityKey");
CREATE INDEX "Skill_agentId_isActive_idx" ON "Skill"("agentId", "isActive");

ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_agentId_fkey";
ALTER TABLE "Skill"
  ADD CONSTRAINT "Skill_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
