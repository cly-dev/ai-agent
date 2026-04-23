-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('C_END', 'B_END');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('C_END_USER', 'CUSTOMER_SERVICE', 'OPERATOR');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'VIEWER');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropIndex
DROP INDEX "User_roleId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roleId",
ADD COLUMN     "userRole" "UserRole",
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'C_END';

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleTool" (
    "id" SERIAL NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "toolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "UserRoleTool_toolId_idx" ON "UserRoleTool"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleTool_userRole_toolId_key" ON "UserRoleTool"("userRole", "toolId");

-- CreateIndex
CREATE INDEX "User_userType_idx" ON "User"("userType");

-- CreateIndex
CREATE INDEX "User_userRole_idx" ON "User"("userRole");

-- AddForeignKey
ALTER TABLE "UserRoleTool" ADD CONSTRAINT "UserRoleTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

