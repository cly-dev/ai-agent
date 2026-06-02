-- CreateEnum
CREATE TYPE "IntegrationAuthMode" AS ENUM ('USER_ONLY', 'SYSTEM_ONLY', 'USER_PREFERRED');

-- Integration.updatedAt：先可空 → 用 createdAt 回填 → 再设 NOT NULL
ALTER TABLE "Integration" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Integration" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Integration" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Integration.apiKey 改为可选；新增 authMode
ALTER TABLE "Integration" ALTER COLUMN "apiKey" DROP NOT NULL;
ALTER TABLE "Integration" ADD COLUMN "authMode" "IntegrationAuthMode" NOT NULL DEFAULT 'USER_PREFERRED';

-- User.employeeId：先可空 → 为旧数据生成 legacy 工号 → 再设 NOT NULL + 唯一
ALTER TABLE "User" ADD COLUMN "employeeId" TEXT;
UPDATE "User" SET "employeeId" = 'legacy_' || "id"::text WHERE "employeeId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "employeeId" SET NOT NULL;
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateTable
CREATE TABLE "UserIntegration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "userApiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIntegration_userId_integrationId_key" ON "UserIntegration"("userId", "integrationId");
CREATE INDEX "UserIntegration_userId_idx" ON "UserIntegration"("userId");
CREATE INDEX "UserIntegration_integrationId_idx" ON "UserIntegration"("integrationId");

-- AddForeignKey
ALTER TABLE "UserIntegration" ADD CONSTRAINT "UserIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserIntegration" ADD CONSTRAINT "UserIntegration_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
