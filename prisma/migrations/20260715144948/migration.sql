-- Historic: originally dropped DEFAULT on Workflow(intent/ir).
-- After 20260715140000, Workflow uses `nodes` again (intent/ir live on Flow).
-- Drop DEFAULT on whichever columns still exist so shadow DB matches schema.prisma
-- (Json fields without @default).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Workflow' AND column_name = 'intent'
  ) THEN
    ALTER TABLE "Workflow" ALTER COLUMN "intent" DROP DEFAULT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Workflow' AND column_name = 'ir'
  ) THEN
    ALTER TABLE "Workflow" ALTER COLUMN "ir" DROP DEFAULT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Workflow' AND column_name = 'nodes'
  ) THEN
    ALTER TABLE "Workflow" ALTER COLUMN "nodes" DROP DEFAULT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkflowRevision' AND column_name = 'intent'
  ) THEN
    ALTER TABLE "WorkflowRevision" ALTER COLUMN "intent" DROP DEFAULT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkflowRevision' AND column_name = 'ir'
  ) THEN
    ALTER TABLE "WorkflowRevision" ALTER COLUMN "ir" DROP DEFAULT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkflowRevision' AND column_name = 'nodes'
  ) THEN
    ALTER TABLE "WorkflowRevision" ALTER COLUMN "nodes" DROP DEFAULT;
  END IF;
END $$;
