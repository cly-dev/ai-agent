-- CreateEnum
CREATE TYPE "ToolLevel" AS ENUM ('L1', 'L2', 'L3');

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "riskLevel" "ToolLevel" NOT NULL DEFAULT 'L1';

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "allowToolLevel" "ToolLevel" NOT NULL DEFAULT 'L1';
