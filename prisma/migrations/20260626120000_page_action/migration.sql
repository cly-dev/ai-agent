-- CreateEnum
CREATE TYPE "PageActionDelivery" AS ENUM ('inline_stream', 'sync');

-- CreateEnum
CREATE TYPE "PageActionRunStatus" AS ENUM ('running', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "PageAction" (
    "id" SERIAL NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "actionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hostToolId" INTEGER NOT NULL,
    "pageScope" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "defaultDelivery" "PageActionDelivery" NOT NULL DEFAULT 'inline_stream',
    "allowCustomInstruction" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "sourceSkillId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageActionRun" (
    "id" SERIAL NOT NULL,
    "pageActionId" INTEGER NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "delivery" "PageActionDelivery" NOT NULL,
    "status" "PageActionRunStatus" NOT NULL DEFAULT 'running',
    "instruction" TEXT,
    "context" JSONB,
    "pageContext" JSONB,
    "fillText" TEXT,
    "dslOutcome" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "streamId" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "durationMs" INTEGER,
    "idempotencyKey" TEXT,
    "clientActionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PageActionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageAction_appClientId_actionKey_key" ON "PageAction"("appClientId", "actionKey");

-- CreateIndex
CREATE INDEX "PageAction_appClientId_isActive_idx" ON "PageAction"("appClientId", "isActive");

-- CreateIndex
CREATE INDEX "PageAction_appClientId_pageScope_isActive_idx" ON "PageAction"("appClientId", "pageScope", "isActive");

-- CreateIndex
CREATE INDEX "PageAction_hostToolId_idx" ON "PageAction"("hostToolId");

-- CreateIndex
CREATE INDEX "PageActionRun_pageActionId_createdAt_idx" ON "PageActionRun"("pageActionId", "createdAt");

-- CreateIndex
CREATE INDEX "PageActionRun_appClientId_userId_createdAt_idx" ON "PageActionRun"("appClientId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "PageActionRun_appClientId_idempotencyKey_idx" ON "PageActionRun"("appClientId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "PageAction" ADD CONSTRAINT "PageAction_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageAction" ADD CONSTRAINT "PageAction_hostToolId_fkey" FOREIGN KEY ("hostToolId") REFERENCES "HostTool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageActionRun" ADD CONSTRAINT "PageActionRun_pageActionId_fkey" FOREIGN KEY ("pageActionId") REFERENCES "PageAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageActionRun" ADD CONSTRAINT "PageActionRun_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageActionRun" ADD CONSTRAINT "PageActionRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
