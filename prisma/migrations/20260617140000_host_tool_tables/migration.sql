-- CreateEnum
CREATE TYPE "HostToolExposure" AS ENUM ('CATALOG', 'ON_COMPLETE', 'LLM', 'BOTH');

-- CreateEnum
CREATE TYPE "HostToolSkillTrigger" AS ENUM ('ON_MUTATION_SUCCESS', 'ON_PLAN_STEP', 'LLM_SCOPED');

-- CreateTable
CREATE TABLE "HostPage" (
    "id" SERIAL NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "routePattern" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostTool" (
    "id" SERIAL NOT NULL,
    "appClientId" INTEGER NOT NULL,
    "hostPageId" INTEGER,
    "definitionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "argsSchema" JSONB NOT NULL,
    "exposure" "HostToolExposure" NOT NULL DEFAULT 'CATALOG',
    "argsTemplate" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentHostTool" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "hostToolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentHostTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillHostTool" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "hostToolId" INTEGER NOT NULL,
    "trigger" "HostToolSkillTrigger" NOT NULL DEFAULT 'ON_MUTATION_SUCCESS',
    "argsTemplate" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillHostTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleHostTool" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "hostToolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleHostTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostPage_appClientId_scope_key" ON "HostPage"("appClientId", "scope");

-- CreateIndex
CREATE INDEX "HostPage_appClientId_isActive_idx" ON "HostPage"("appClientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HostTool_appClientId_definitionKey_key" ON "HostTool"("appClientId", "definitionKey");

-- CreateIndex
CREATE UNIQUE INDEX "HostTool_appClientId_name_key" ON "HostTool"("appClientId", "name");

-- CreateIndex
CREATE INDEX "HostTool_appClientId_idx" ON "HostTool"("appClientId");

-- CreateIndex
CREATE INDEX "HostTool_hostPageId_idx" ON "HostTool"("hostPageId");

-- CreateIndex
CREATE INDEX "HostTool_appClientId_isActive_idx" ON "HostTool"("appClientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgentHostTool_agentId_hostToolId_key" ON "AgentHostTool"("agentId", "hostToolId");

-- CreateIndex
CREATE INDEX "AgentHostTool_agentId_idx" ON "AgentHostTool"("agentId");

-- CreateIndex
CREATE INDEX "AgentHostTool_hostToolId_idx" ON "AgentHostTool"("hostToolId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillHostTool_skillId_hostToolId_key" ON "SkillHostTool"("skillId", "hostToolId");

-- CreateIndex
CREATE INDEX "SkillHostTool_skillId_idx" ON "SkillHostTool"("skillId");

-- CreateIndex
CREATE INDEX "SkillHostTool_hostToolId_idx" ON "SkillHostTool"("hostToolId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleHostTool_roleId_hostToolId_key" ON "RoleHostTool"("roleId", "hostToolId");

-- CreateIndex
CREATE INDEX "RoleHostTool_roleId_idx" ON "RoleHostTool"("roleId");

-- CreateIndex
CREATE INDEX "RoleHostTool_hostToolId_idx" ON "RoleHostTool"("hostToolId");

-- AddForeignKey
ALTER TABLE "HostPage" ADD CONSTRAINT "HostPage_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostTool" ADD CONSTRAINT "HostTool_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostTool" ADD CONSTRAINT "HostTool_hostPageId_fkey" FOREIGN KEY ("hostPageId") REFERENCES "HostPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentHostTool" ADD CONSTRAINT "AgentHostTool_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentHostTool" ADD CONSTRAINT "AgentHostTool_hostToolId_fkey" FOREIGN KEY ("hostToolId") REFERENCES "HostTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillHostTool" ADD CONSTRAINT "SkillHostTool_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillHostTool" ADD CONSTRAINT "SkillHostTool_hostToolId_fkey" FOREIGN KEY ("hostToolId") REFERENCES "HostTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleHostTool" ADD CONSTRAINT "RoleHostTool_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleHostTool" ADD CONSTRAINT "RoleHostTool_hostToolId_fkey" FOREIGN KEY ("hostToolId") REFERENCES "HostTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
