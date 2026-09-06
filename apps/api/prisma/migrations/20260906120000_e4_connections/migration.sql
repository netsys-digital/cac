-- E4 connections, saved items, follows
DO $$ BEGIN
  CREATE TYPE "ConnectionObjective" AS ENUM ('KNOW_MORE', 'IMPLEMENT_SOLUTION', 'PARTNERSHIP', 'FUNDING');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "ConnectionTargetType" AS ENUM ('TECHNOLOGY', 'PROJECT', 'FUNDING_OFFER', 'SUCCESS_CASE', 'CHALLENGE', 'ORGANIZATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONTACT_SHARED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Connection" (
    "id" UUID NOT NULL,
    "requesterOrgId" UUID NOT NULL,
    "targetOrgId" UUID NOT NULL,
    "requesterUserId" UUID NOT NULL,
    "targetType" "ConnectionTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "objective" "ConnectionObjective" NOT NULL,
    "message" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reminderSentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Connection_status_idx" ON "Connection"("status");
CREATE INDEX IF NOT EXISTS "Connection_requesterOrgId_idx" ON "Connection"("requesterOrgId");
CREATE INDEX IF NOT EXISTS "Connection_targetOrgId_idx" ON "Connection"("targetOrgId");
CREATE INDEX IF NOT EXISTS "Connection_requesterUserId_idx" ON "Connection"("requesterUserId");
CREATE INDEX IF NOT EXISTS "Connection_targetType_targetId_idx" ON "Connection"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "Connection_expiresAt_idx" ON "Connection"("expiresAt");

CREATE TABLE IF NOT EXISTS "SavedItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" "ConnectionTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedItem_userId_targetType_targetId_key" ON "SavedItem"("userId", "targetType", "targetId");
CREATE INDEX IF NOT EXISTS "SavedItem_userId_idx" ON "SavedItem"("userId");

CREATE TABLE IF NOT EXISTS "Follow" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Follow_userId_organizationId_key" ON "Follow"("userId", "organizationId");
CREATE INDEX IF NOT EXISTS "Follow_userId_idx" ON "Follow"("userId");
CREATE INDEX IF NOT EXISTS "Follow_organizationId_idx" ON "Follow"("organizationId");

DO $$ BEGIN
  ALTER TABLE "Connection" ADD CONSTRAINT "Connection_requesterOrgId_fkey" FOREIGN KEY ("requesterOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Connection" ADD CONSTRAINT "Connection_targetOrgId_fkey" FOREIGN KEY ("targetOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Connection" ADD CONSTRAINT "Connection_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Follow" ADD CONSTRAINT "Follow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
