-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN "outputMessageId" INTEGER;

-- CreateIndex
CREATE INDEX "AgentRun_outputMessageId_idx" ON "AgentRun"("outputMessageId");

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_outputMessageId_fkey" FOREIGN KEY ("outputMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
