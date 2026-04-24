-- Merge UserAppRole into UserApp (one role per user+app)

ALTER TABLE "UserApp"
ADD COLUMN "roleId" INTEGER;

-- If one user had multiple roles in one app, keep the latest record.
UPDATE "UserApp" AS ua
SET "roleId" = latest."roleId"
FROM (
  SELECT DISTINCT ON ("userId", "appId")
    "userId",
    "appId",
    "roleId"
  FROM "UserAppRole"
  ORDER BY "userId", "appId", "createdAt" DESC, "id" DESC
) AS latest
WHERE ua."userId" = latest."userId"
  AND ua."appId" = latest."appId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "UserApp" WHERE "roleId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot merge UserAppRole: some UserApp rows have no role mapping';
  END IF;
END $$;

ALTER TABLE "UserApp"
ALTER COLUMN "roleId" SET NOT NULL;

CREATE INDEX "UserApp_roleId_idx" ON "UserApp"("roleId");

ALTER TABLE "UserApp"
ADD CONSTRAINT "UserApp_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "UserAppRole";
