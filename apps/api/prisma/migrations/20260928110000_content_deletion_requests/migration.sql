-- Solicitação de exclusão de publicação (membro solicita, curadoria aprova)
DO $$ BEGIN
  CREATE TYPE "DeletionRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "ContentDeletionRequest" (
    "id" UUID NOT NULL,
    "targetType" "ConnectionTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "targetTitle" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "requesterUserId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reviewerUserId" UUID,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentDeletionRequest_status_idx" ON "ContentDeletionRequest"("status");
CREATE INDEX IF NOT EXISTS "ContentDeletionRequest_organizationId_idx" ON "ContentDeletionRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "ContentDeletionRequest_targetType_targetId_idx" ON "ContentDeletionRequest"("targetType", "targetId");

DO $$ BEGIN
  ALTER TABLE "ContentDeletionRequest" ADD CONSTRAINT "ContentDeletionRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ContentDeletionRequest" ADD CONSTRAINT "ContentDeletionRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ContentDeletionRequest" ADD CONSTRAINT "ContentDeletionRequest_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
