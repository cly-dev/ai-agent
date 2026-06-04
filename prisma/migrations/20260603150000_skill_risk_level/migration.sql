-- Skill 风险等级（与 Tool.riskLevel 同枚举；L2/L3 写操作需用户确认后执行）。

ALTER TABLE "Skill" ADD COLUMN "riskLevel" "ToolLevel" NOT NULL DEFAULT 'L1';

CREATE INDEX "Skill_agentId_riskLevel_idx" ON "Skill"("agentId", "riskLevel");
