-- Skill 按 AppClient 隔离；补齐关联索引与级联删除。

-- Skill: 应用归属与状态字段
ALTER TABLE "Skill" ADD COLUMN "appClientId" INTEGER;
UPDATE "Skill" SET "appClientId" = sub.min_id
FROM (SELECT MIN("id") AS min_id FROM "AppClient") sub
WHERE "Skill"."appClientId" IS NULL AND sub.min_id IS NOT NULL;
ALTER TABLE "Skill" ALTER COLUMN "appClientId" SET NOT NULL;

ALTER TABLE "Skill" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Skill" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Skill_appClientId_name_key" ON "Skill"("appClientId", "name");
CREATE INDEX "Skill_appClientId_isActive_idx" ON "Skill"("appClientId", "isActive");

ALTER TABLE "Skill"
  ADD CONSTRAINT "Skill_appClientId_fkey"
  FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillTool: gate 必选工具标记
ALTER TABLE "SkillTool" ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "SkillTool_skillId_idx" ON "SkillTool"("skillId");
CREATE INDEX IF NOT EXISTS "SkillTool_toolId_idx" ON "SkillTool"("toolId");

ALTER TABLE "SkillTool" DROP CONSTRAINT IF EXISTS "SkillTool_skillId_fkey";
ALTER TABLE "SkillTool" DROP CONSTRAINT IF EXISTS "SkillTool_toolId_fkey";
ALTER TABLE "SkillTool"
  ADD CONSTRAINT "SkillTool_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillTool"
  ADD CONSTRAINT "SkillTool_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RoleSkill: 与 Role / Skill 级联
CREATE INDEX IF NOT EXISTS "roleskill_roleId_idx" ON "roleskill"("roleId");
CREATE INDEX IF NOT EXISTS "roleskill_skillId_idx" ON "roleskill"("skillId");

ALTER TABLE "roleskill" DROP CONSTRAINT IF EXISTS "roleskill_roleId_fkey";
ALTER TABLE "roleskill" DROP CONSTRAINT IF EXISTS "roleskill_skillId_fkey";
ALTER TABLE "roleskill"
  ADD CONSTRAINT "roleskill_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roleskill"
  ADD CONSTRAINT "roleskill_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AgentSkill: 与 Agent / Skill 级联
CREATE INDEX IF NOT EXISTS "AgentSkill_agentId_idx" ON "AgentSkill"("agentId");
CREATE INDEX IF NOT EXISTS "AgentSkill_skillId_idx" ON "AgentSkill"("skillId");

ALTER TABLE "AgentSkill" DROP CONSTRAINT IF EXISTS "AgentSkill_agentId_fkey";
ALTER TABLE "AgentSkill" DROP CONSTRAINT IF EXISTS "AgentSkill_skillId_fkey";
ALTER TABLE "AgentSkill"
  ADD CONSTRAINT "AgentSkill_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentSkill"
  ADD CONSTRAINT "AgentSkill_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
