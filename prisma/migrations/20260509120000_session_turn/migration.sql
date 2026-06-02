-- CreateEnum
CREATE TYPE "AgentRunRole" AS ENUM ('primary', 'router', 'worker', 'reviewer');

-- CreateTable
CREATE TABLE "SessionTurn" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "userInput" TEXT NOT NULL,
    "finalOutput" TEXT,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'running',
    "primaryAgentId" INTEGER,
    "agentRunCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "llmDurationMs" INTEGER,
    "toolDurationMs" INTEGER,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "llmCallCount" INTEGER NOT NULL DEFAULT 0,
    "toolCallCount" INTEGER NOT NULL DEFAULT 0,
    "toolsUsed" JSONB,
    "finishReason" TEXT,
    "messageIdUser" INTEGER,
    "messageIdAssistant" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionTurn_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN     "turnId" INTEGER,
ADD COLUMN     "userId" INTEGER,
ADD COLUMN     "role" "AgentRunRole" NOT NULL DEFAULT 'primary',
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "parentRunId" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "llmDurationMs" INTEGER,
ADD COLUMN     "toolDurationMs" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER,
ADD COLUMN     "llmCallCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "toolCallCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "toolsUsed" JSONB,
ADD COLUMN     "finishReason" TEXT,
ADD COLUMN     "scopedToolCount" INTEGER;

-- CreateIndex
CREATE INDEX "SessionTurn_sessionId_idx" ON "SessionTurn"("sessionId");
CREATE INDEX "SessionTurn_userId_idx" ON "SessionTurn"("userId");
CREATE INDEX "SessionTurn_appClientId_idx" ON "SessionTurn"("appClientId");
CREATE INDEX "SessionTurn_status_idx" ON "SessionTurn"("status");
CREATE INDEX "SessionTurn_createdAt_idx" ON "SessionTurn"("createdAt");
CREATE INDEX "SessionTurn_primaryAgentId_idx" ON "SessionTurn"("primaryAgentId");

CREATE INDEX "AgentRun_turnId_idx" ON "AgentRun"("turnId");
CREATE INDEX "AgentRun_userId_idx" ON "AgentRun"("userId");
CREATE INDEX "AgentRun_parentRunId_idx" ON "AgentRun"("parentRunId");

-- AddForeignKey
ALTER TABLE "SessionTurn" ADD CONSTRAINT "SessionTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionTurn" ADD CONSTRAINT "SessionTurn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionTurn" ADD CONSTRAINT "SessionTurn_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionTurn" ADD CONSTRAINT "SessionTurn_primaryAgentId_fkey" FOREIGN KEY ("primaryAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "SessionTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_parentRunId_fkey" FOREIGN KEY ("parentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
