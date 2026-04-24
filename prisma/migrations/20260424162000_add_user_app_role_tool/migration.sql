-- User-App binding and role-based tool permission tables

CREATE TABLE "UserApp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "appId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserApp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAppRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "appId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAppRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoleTool" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "toolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleTool_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserApp_userId_appId_key" ON "UserApp"("userId", "appId");
CREATE UNIQUE INDEX "UserAppRole_userId_appId_roleId_key" ON "UserAppRole"("userId", "appId", "roleId");
CREATE UNIQUE INDEX "RoleTool_roleId_toolId_key" ON "RoleTool"("roleId", "toolId");

CREATE INDEX "UserApp_userId_idx" ON "UserApp"("userId");
CREATE INDEX "UserApp_appId_idx" ON "UserApp"("appId");
CREATE INDEX "UserAppRole_userId_idx" ON "UserAppRole"("userId");
CREATE INDEX "UserAppRole_appId_idx" ON "UserAppRole"("appId");
CREATE INDEX "UserAppRole_roleId_idx" ON "UserAppRole"("roleId");
CREATE INDEX "RoleTool_roleId_idx" ON "RoleTool"("roleId");
CREATE INDEX "RoleTool_toolId_idx" ON "RoleTool"("toolId");

ALTER TABLE "UserApp"
ADD CONSTRAINT "UserApp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserApp"
ADD CONSTRAINT "UserApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAppRole"
ADD CONSTRAINT "UserAppRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAppRole"
ADD CONSTRAINT "UserAppRole_appId_fkey" FOREIGN KEY ("appId") REFERENCES "AppClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAppRole"
ADD CONSTRAINT "UserAppRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAppRole"
ADD CONSTRAINT "UserAppRole_userId_appId_fkey" FOREIGN KEY ("userId", "appId") REFERENCES "UserApp"("userId", "appId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoleTool"
ADD CONSTRAINT "RoleTool_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoleTool"
ADD CONSTRAINT "RoleTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
