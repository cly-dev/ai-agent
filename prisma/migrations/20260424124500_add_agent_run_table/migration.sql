CREATE TYPE "AgentRunStatus" AS ENUM ('running', 'success', 'failed');

CREATE TABLE "AgentRun" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'running',
    "steps" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "maxSteps" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentRun_agentId_idx" ON "AgentRun"("agentId");
CREATE INDEX "AgentRun_status_idx" ON "AgentRun"("status");
CREATE INDEX "AgentRun_createdAt_idx" ON "AgentRun"("createdAt");

ALTER TABLE "AgentRun"
ADD CONSTRAINT "AgentRun_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
