/*
  Warnings:

  - Added the required column `sessionId` to the `AgentRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "systemPrompt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AgentRun_sessionId_idx" ON "AgentRun"("sessionId");

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
