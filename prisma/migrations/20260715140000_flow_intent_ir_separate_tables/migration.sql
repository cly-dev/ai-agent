-- Intent/IR 新表 Flow*；legacy Workflow 恢复 nodes 列（与 Flow 分表）。

-- 1) 新建 Flow 家族
CREATE TABLE IF NOT EXISTS "Flow" (
  "id" SERIAL PRIMARY KEY,
  "appClientId" INTEGER NOT NULL,
  "flowKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "goal" TEXT,
  "profile" "WorkflowProfile" NOT NULL,
  "deliverable" "WorkflowDeliverable" NOT NULL DEFAULT 'answer',
  "intent" JSONB NOT NULL,
  "ir" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "constraints" JSONB NOT NULL DEFAULT '[]',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Flow_appClientId_fkey" FOREIGN KEY ("appClientId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Flow_appClientId_flowKey_key" ON "Flow"("appClientId", "flowKey");
CREATE INDEX IF NOT EXISTS "Flow_appClientId_isActive_idx" ON "Flow"("appClientId", "isActive");

CREATE TABLE IF NOT EXISTS "FlowRevision" (
  "id" SERIAL PRIMARY KEY,
  "flowId" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "intent" JSONB NOT NULL,
  "ir" JSONB NOT NULL,
  "deliverable" "WorkflowDeliverable" NOT NULL,
  "constraints" JSONB NOT NULL DEFAULT '[]',
  "changeNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlowRevision_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FlowRevision_flowId_version_key" ON "FlowRevision"("flowId", "version");
CREATE INDEX IF NOT EXISTS "FlowRevision_flowId_version_idx" ON "FlowRevision"("flowId", "version");

CREATE TABLE IF NOT EXISTS "FlowTool" (
  "id" SERIAL PRIMARY KEY,
  "flowId" INTEGER NOT NULL,
  "toolId" INTEGER NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "FlowTool_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FlowTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FlowTool_flowId_toolId_key" ON "FlowTool"("flowId", "toolId");
CREATE INDEX IF NOT EXISTS "FlowTool_flowId_idx" ON "FlowTool"("flowId");
CREATE INDEX IF NOT EXISTS "FlowTool_toolId_idx" ON "FlowTool"("toolId");

CREATE TABLE IF NOT EXISTS "FlowHostTool" (
  "id" SERIAL PRIMARY KEY,
  "flowId" INTEGER NOT NULL,
  "hostToolId" INTEGER NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "FlowHostTool_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FlowHostTool_hostToolId_fkey" FOREIGN KEY ("hostToolId") REFERENCES "HostTool"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FlowHostTool_flowId_hostToolId_key" ON "FlowHostTool"("flowId", "hostToolId");
CREATE INDEX IF NOT EXISTS "FlowHostTool_flowId_idx" ON "FlowHostTool"("flowId");
CREATE INDEX IF NOT EXISTS "FlowHostTool_hostToolId_idx" ON "FlowHostTool"("hostToolId");

-- 2) Skill / PageAction 挂 flow
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "flowId" INTEGER;
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "flowVersion" INTEGER;
CREATE INDEX IF NOT EXISTS "Skill_flowId_idx" ON "Skill"("flowId");
DO $$ BEGIN
  ALTER TABLE "Skill" ADD CONSTRAINT "Skill_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PageAction" ADD COLUMN IF NOT EXISTS "flowId" INTEGER;
ALTER TABLE "PageAction" ADD COLUMN IF NOT EXISTS "flowVersion" INTEGER;
CREATE INDEX IF NOT EXISTS "PageAction_flowId_idx" ON "PageAction"("flowId");
DO $$ BEGIN
  ALTER TABLE "PageAction" ADD CONSTRAINT "PageAction_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) 若 Workflow 仍是 intent/ir 形态：迁移到 Flow 后恢复 nodes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Workflow' AND column_name = 'intent'
  ) THEN
    -- 把现有意图编排搬到 Flow（破坏性可接受：键加 _migrated）
    INSERT INTO "Flow" (
      "appClientId", "flowKey", "name", "description", "goal", "profile",
      "deliverable", "intent", "ir", "version", "constraints", "isActive",
      "sortOrder", "createdAt", "updatedAt"
    )
    SELECT
      w."appClientId",
      w."workflowKey" || '_flow',
      w."name",
      w."description",
      w."goal",
      w."profile",
      w."deliverable",
      w."intent",
      w."ir",
      w."version",
      w."constraints",
      w."isActive",
      w."sortOrder",
      w."createdAt",
      w."updatedAt"
    FROM "Workflow" w
    ON CONFLICT DO NOTHING;

    ALTER TABLE "WorkflowRevision" DROP COLUMN IF EXISTS "intent";
    -- ir → nodes for revision
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'WorkflowRevision' AND column_name = 'ir'
    ) THEN
      ALTER TABLE "WorkflowRevision" RENAME COLUMN "ir" TO "nodes";
    END IF;

    ALTER TABLE "Workflow" DROP COLUMN IF EXISTS "intent";
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Workflow' AND column_name = 'ir'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Workflow' AND column_name = 'nodes'
    ) THEN
      ALTER TABLE "Workflow" RENAME COLUMN "ir" TO "nodes";
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Workflow' AND column_name = 'ir'
    ) THEN
      ALTER TABLE "Workflow" DROP COLUMN "ir";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Workflow' AND column_name = 'nodes'
    ) THEN
      ALTER TABLE "Workflow" ADD COLUMN "nodes" JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}';
    END IF;
  END IF;
END $$;
