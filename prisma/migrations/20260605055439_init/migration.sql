-- DropIndex
DROP INDEX "LlmModelConfig_singletonKey_key";

-- DropIndex
DROP INDEX "Skill_agentId_riskLevel_idx";

-- AlterTable
ALTER TABLE "LlmModelConfig" ALTER COLUMN "singletonKey" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Skill" ALTER COLUMN "updatedAt" DROP DEFAULT;
