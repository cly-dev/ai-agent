-- CreateEnum
CREATE TYPE "LlmModelKind" AS ENUM ('chat', 'transformers_embedding', 'api_embedding');

-- AlterTable LlmModelConfig
ALTER TABLE "LlmModelConfig" ADD COLUMN "kind" "LlmModelKind" NOT NULL DEFAULT 'chat';

ALTER TABLE "LlmModelConfig" DROP CONSTRAINT IF EXISTS "LlmModelConfig_singletonKey_key";

ALTER TABLE "LlmModelConfig" ALTER COLUMN "singletonKey" DROP NOT NULL;

CREATE UNIQUE INDEX "LlmModelConfig_kind_key" ON "LlmModelConfig"("kind");

-- CreateTable IntentRecallConfig
CREATE TABLE "IntentRecallConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "singletonKey" INTEGER NOT NULL DEFAULT 1,
    "recallMode" TEXT NOT NULL DEFAULT 'auto',
    "vectorTopK" INTEGER NOT NULL DEFAULT 10,
    "vectorMinScore" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "bindToolsMax" INTEGER NOT NULL DEFAULT 25,
    "fallbackToKeyword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentRecallConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntentRecallConfig_singletonKey_key" ON "IntentRecallConfig"("singletonKey");
