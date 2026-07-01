-- CreateEnum
CREATE TYPE "WorkflowProfile" AS ENUM ('chat_skill', 'page_action', 'shared');

-- CreateEnum
CREATE TYPE "WorkflowDeliverable" AS ENUM ('analysis', 'list', 'detail', 'mutation', 'answer');

-- CreateTable
CREATE TABLE "Workflow" (
    "id" SERIAL NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "workflowKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "profile" "WorkflowProfile" NOT NULL,
    "deliverable" "WorkflowDeliverable" NOT NULL DEFAULT 'answer',
    "nodes" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "constraints" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRevision" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "nodes" JSONB NOT NULL,
    "deliverable" "WorkflowDeliverable" NOT NULL,
    "constraints" JSONB NOT NULL DEFAULT '[]',
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTool" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "toolId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkflowTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowHostTool" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "hostToolId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkflowHostTool_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN "workflowId" INTEGER,
ADD COLUMN "workflowVersion" INTEGER,
ADD COLUMN "workflowOverrides" JSONB;

-- AlterTable
ALTER TABLE "PageAction" ADD COLUMN "workflowId" INTEGER,
ADD COLUMN "workflowVersion" INTEGER,
ADD COLUMN "workflowOverrides" JSONB;

-- AlterTable
ALTER TABLE "PageActionRun" ADD COLUMN "workflowId" INTEGER,
ADD COLUMN "workflowVersion" INTEGER,
ADD COLUMN "workflowRun" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_appClientId_workflowKey_key" ON "Workflow"("appClientId", "workflowKey");

-- CreateIndex
CREATE INDEX "Workflow_appClientId_isActive_idx" ON "Workflow"("appClientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRevision_workflowId_version_key" ON "WorkflowRevision"("workflowId", "version");

-- CreateIndex
CREATE INDEX "WorkflowRevision_workflowId_version_idx" ON "WorkflowRevision"("workflowId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTool_workflowId_toolId_key" ON "WorkflowTool"("workflowId", "toolId");

-- CreateIndex
CREATE INDEX "WorkflowTool_workflowId_idx" ON "WorkflowTool"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowTool_toolId_idx" ON "WorkflowTool"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowHostTool_workflowId_hostToolId_key" ON "WorkflowHostTool"("workflowId", "hostToolId");

-- CreateIndex
CREATE INDEX "WorkflowHostTool_workflowId_idx" ON "WorkflowHostTool"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowHostTool_hostToolId_idx" ON "WorkflowHostTool"("hostToolId");

-- CreateIndex
CREATE INDEX "Skill_workflowId_idx" ON "Skill"("workflowId");

-- CreateIndex
CREATE INDEX "PageAction_workflowId_idx" ON "PageAction"("workflowId");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageAction" ADD CONSTRAINT "PageAction_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRevision" ADD CONSTRAINT "WorkflowRevision_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTool" ADD CONSTRAINT "WorkflowTool_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTool" ADD CONSTRAINT "WorkflowTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHostTool" ADD CONSTRAINT "WorkflowHostTool_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHostTool" ADD CONSTRAINT "WorkflowHostTool_hostToolId_fkey" FOREIGN KEY ("hostToolId") REFERENCES "HostTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
