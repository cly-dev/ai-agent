/*
  Warnings:

  - Added the required column `inputSchema` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integrationId` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tool` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('Get', 'Post', 'Put', 'Delete');

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "inputSchema" JSONB NOT NULL,
ADD COLUMN     "integrationId" INTEGER NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "method" "HttpMethod" NOT NULL,
ADD COLUMN     "outputSchema" JSONB,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "timeout" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Integration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
