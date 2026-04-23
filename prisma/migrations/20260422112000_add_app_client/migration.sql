-- CreateTable
CREATE TABLE "AppClient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dsn" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppClient_dsn_key" ON "AppClient"("dsn");

