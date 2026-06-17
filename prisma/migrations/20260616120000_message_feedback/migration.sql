-- CreateEnum
CREATE TYPE "MessageFeedbackRating" AS ENUM ('up', 'down');

-- CreateTable
CREATE TABLE "MessageFeedback" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "sessionId" VARCHAR(32) NOT NULL,
    "userId" INTEGER NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "turnId" INTEGER,
    "agentId" INTEGER,
    "rating" "MessageFeedbackRating" NOT NULL,
    "reasonTags" JSONB,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageFeedback_messageId_userId_key" ON "MessageFeedback"("messageId", "userId");

-- CreateIndex
CREATE INDEX "MessageFeedback_sessionId_idx" ON "MessageFeedback"("sessionId");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_idx" ON "MessageFeedback"("userId");

-- CreateIndex
CREATE INDEX "MessageFeedback_appClientId_rating_idx" ON "MessageFeedback"("appClientId", "rating");

-- CreateIndex
CREATE INDEX "MessageFeedback_turnId_idx" ON "MessageFeedback"("turnId");

-- CreateIndex
CREATE INDEX "MessageFeedback_agentId_idx" ON "MessageFeedback"("agentId");

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
