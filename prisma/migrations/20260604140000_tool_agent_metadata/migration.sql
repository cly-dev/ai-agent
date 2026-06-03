-- Tool.agentMetadata: structured fields for agent tool selection (mode/resource/operation/...)
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "agentMetadata" JSONB;
