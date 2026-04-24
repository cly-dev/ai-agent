-- Destructive reset for user-app relationship table.
-- This will drop old relation tables and recreate UserApp with roleId.

DROP TABLE IF EXISTS "UserAppRole";
DROP TABLE IF EXISTS "UserApp";

CREATE TABLE "UserApp" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "appId" INTEGER NOT NULL,
  "roleId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserApp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserApp_userId_appId_key" ON "UserApp"("userId", "appId");
CREATE INDEX "UserApp_userId_idx" ON "UserApp"("userId");
CREATE INDEX "UserApp_appId_idx" ON "UserApp"("appId");
CREATE INDEX "UserApp_roleId_idx" ON "UserApp"("roleId");

ALTER TABLE "UserApp"
ADD CONSTRAINT "UserApp_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserApp"
ADD CONSTRAINT "UserApp_appId_fkey"
FOREIGN KEY ("appId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserApp"
ADD CONSTRAINT "UserApp_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
