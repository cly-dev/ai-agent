-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "appClientId" INTEGER,
    "agentId" INTEGER,
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "category" TEXT,
    "title" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_key_appClientId_agentId_locale_version_key" ON "PromptTemplate"("key", "appClientId", "agentId", "locale", "version");

-- CreateIndex
CREATE INDEX "PromptTemplate_key_appClientId_agentId_locale_isActive_idx" ON "PromptTemplate"("key", "appClientId", "agentId", "locale", "isActive");

-- CreateIndex
CREATE INDEX "PromptTemplate_key_isActive_idx" ON "PromptTemplate"("key", "isActive");

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
