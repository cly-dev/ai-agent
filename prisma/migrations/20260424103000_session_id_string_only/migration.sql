-- Session: single string PK (32 hex). Drop integer id + optional sid bridge.
-- Message.sessionId becomes TEXT referencing Session.id.

-- Ensure Session.sid exists for mapping int id -> string id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Session' AND column_name = 'sid'
  ) THEN
    ALTER TABLE "Session" ADD COLUMN "sid" VARCHAR(32);
    UPDATE "Session" SET "sid" = encode(gen_random_bytes(16), 'hex') WHERE "sid" IS NULL;
    ALTER TABLE "Session" ALTER COLUMN "sid" SET NOT NULL;
    CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");
  END IF;
END $$;

ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_sessionId_fkey";

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "_sessionIdStr" TEXT;
UPDATE "Message" m SET "_sessionIdStr" = s."sid" FROM "Session" s WHERE m."sessionId" = s."id";
DELETE FROM "Message" WHERE "_sessionIdStr" IS NULL;
ALTER TABLE "Message" DROP COLUMN "sessionId";
ALTER TABLE "Message" RENAME COLUMN "_sessionIdStr" TO "sessionId";
ALTER TABLE "Message" ALTER COLUMN "sessionId" SET NOT NULL;

ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey";
DROP INDEX IF EXISTS "Session_sid_key";
ALTER TABLE "Session" DROP COLUMN "id";
ALTER TABLE "Session" RENAME COLUMN "sid" TO "id";
ALTER TABLE "Session" ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Message_sessionId_idx" ON "Message"("sessionId");
