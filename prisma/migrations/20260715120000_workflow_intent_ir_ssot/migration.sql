-- BREAKING: Workflow config SSOT = intent; IR stored in ir.
-- Existing workflows cannot be migrated automatically — truncate and recreate.

DELETE FROM "WorkflowRevision";
DELETE FROM "WorkflowHostTool";
DELETE FROM "WorkflowTool";
-- Keep Workflow rows only if you will immediately re-seed; safest is delete all workflows.
DELETE FROM "Workflow";

ALTER TABLE "Workflow" DROP COLUMN IF EXISTS "nodes";
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "intent" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "ir" JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb;

ALTER TABLE "WorkflowRevision" DROP COLUMN IF EXISTS "nodes";
ALTER TABLE "WorkflowRevision" ADD COLUMN IF NOT EXISTS "intent" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "WorkflowRevision" ADD COLUMN IF NOT EXISTS "ir" JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb;
