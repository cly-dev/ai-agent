-- CreateTable
CREATE TABLE "ToolCategory" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolCategory_sortOrder_idx" ON "ToolCategory"("sortOrder");

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN "toolCategoryId" INTEGER;

-- CreateIndex
CREATE INDEX "Tool_toolCategoryId_idx" ON "Tool"("toolCategoryId");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_toolCategoryId_fkey" FOREIGN KEY ("toolCategoryId") REFERENCES "ToolCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropColumn (replaced by business ToolCategory)
ALTER TABLE "Tool" DROP COLUMN "toolKind";

-- DropEnum
DROP TYPE "ToolKind";
