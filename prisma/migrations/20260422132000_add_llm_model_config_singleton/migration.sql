-- CreateTable
CREATE TABLE "LlmModelConfig" (
    "id" SERIAL NOT NULL,
    "singletonKey" INTEGER NOT NULL DEFAULT 1,
    "provider" TEXT NOT NULL DEFAULT 'openai-compatible',
    "model" TEXT NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT NOT NULL,
    "chatPath" TEXT NOT NULL DEFAULT '/v1/chat/completions',
    "parameters" JSONB,
    "stream" BOOLEAN NOT NULL DEFAULT false,
    "maxTokens" INTEGER,
    "temperature" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LlmModelConfig_singletonKey_key" ON "LlmModelConfig"("singletonKey");
