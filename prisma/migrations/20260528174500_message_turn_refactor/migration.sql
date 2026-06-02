-- Rename SessionTurn to MessageTurn
ALTER TABLE "SessionTurn" RENAME TO "MessageTurn";

-- Rename columns for message associations
ALTER TABLE "MessageTurn" RENAME COLUMN "messageIdUser" TO "messageId";
ALTER TABLE "MessageTurn" RENAME COLUMN "messageIdAssistant" TO "outputMessageId";

-- Rename primary key and foreign key constraints
ALTER TABLE "MessageTurn" RENAME CONSTRAINT "SessionTurn_pkey" TO "MessageTurn_pkey";
ALTER TABLE "MessageTurn" RENAME CONSTRAINT "SessionTurn_sessionId_fkey" TO "MessageTurn_sessionId_fkey";
ALTER TABLE "MessageTurn" RENAME CONSTRAINT "SessionTurn_userId_fkey" TO "MessageTurn_userId_fkey";
ALTER TABLE "MessageTurn" RENAME CONSTRAINT "SessionTurn_appClientId_fkey" TO "MessageTurn_appClientId_fkey";
ALTER TABLE "MessageTurn" RENAME CONSTRAINT "SessionTurn_primaryAgentId_fkey" TO "MessageTurn_primaryAgentId_fkey";

-- AgentRun turn foreign key now points to MessageTurn
ALTER TABLE "AgentRun" DROP CONSTRAINT IF EXISTS "AgentRun_turnId_fkey";
ALTER TABLE "AgentRun"
  ADD CONSTRAINT "AgentRun_turnId_fkey"
  FOREIGN KEY ("turnId") REFERENCES "MessageTurn"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove old index names and create new ones
DROP INDEX IF EXISTS "SessionTurn_sessionId_idx";
DROP INDEX IF EXISTS "SessionTurn_userId_idx";
DROP INDEX IF EXISTS "SessionTurn_appClientId_idx";
DROP INDEX IF EXISTS "SessionTurn_status_idx";
DROP INDEX IF EXISTS "SessionTurn_createdAt_idx";
DROP INDEX IF EXISTS "SessionTurn_primaryAgentId_idx";

CREATE INDEX "MessageTurn_messageId_idx" ON "MessageTurn"("messageId");
CREATE INDEX "MessageTurn_outputMessageId_idx" ON "MessageTurn"("outputMessageId");
CREATE INDEX "MessageTurn_sessionId_idx" ON "MessageTurn"("sessionId");
CREATE INDEX "MessageTurn_userId_idx" ON "MessageTurn"("userId");
CREATE INDEX "MessageTurn_appClientId_idx" ON "MessageTurn"("appClientId");
CREATE INDEX "MessageTurn_status_idx" ON "MessageTurn"("status");
CREATE INDEX "MessageTurn_createdAt_idx" ON "MessageTurn"("createdAt");
CREATE INDEX "MessageTurn_primaryAgentId_idx" ON "MessageTurn"("primaryAgentId");

-- Add message foreign keys
ALTER TABLE "MessageTurn" DROP CONSTRAINT IF EXISTS "MessageTurn_messageId_fkey";
ALTER TABLE "MessageTurn" DROP CONSTRAINT IF EXISTS "MessageTurn_outputMessageId_fkey";
ALTER TABLE "MessageTurn"
  ADD CONSTRAINT "MessageTurn_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageTurn"
  ADD CONSTRAINT "MessageTurn_outputMessageId_fkey"
  FOREIGN KEY ("outputMessageId") REFERENCES "Message"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
