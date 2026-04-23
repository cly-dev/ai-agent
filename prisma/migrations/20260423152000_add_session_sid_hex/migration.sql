ALTER TABLE "Session"
ADD COLUMN "sid" VARCHAR(32);

UPDATE "Session"
SET "sid" = md5(random()::text || clock_timestamp()::text || id::text)
WHERE "sid" IS NULL;

ALTER TABLE "Session"
ALTER COLUMN "sid" SET NOT NULL;

CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");
