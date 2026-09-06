-- AlterTable Organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "website" TEXT;
CREATE INDEX IF NOT EXISTS "Organization_verificationStatus_idx" ON "Organization"("verificationStatus");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RepresentationStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ClimateAction" AS ENUM ('ADAPTATION', 'MITIGATION', 'BOTH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectType" AS ENUM ('PROJECT', 'INITIATIVE', 'POLICY', 'PROGRAMME');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "NeedType" AS ENUM ('TECHNOLOGY', 'KNOWLEDGE', 'PARTNERSHIP', 'FUNDING', 'TRAINING', 'RESEARCH', 'EQUIPMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "Maturity" AS ENUM ('RESEARCH', 'VALIDATION', 'DEMONSTRATION', 'READY_FOR_IMPLEMENTATION', 'AT_SCALE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'PDF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable OrgRepresentationRequest
CREATE TABLE IF NOT EXISTS "OrgRepresentationRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "unit" TEXT NOT NULL,
    "linkRole" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "status" "RepresentationStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgRepresentationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrgRepresentationRequest_userId_organizationId_key"
  ON "OrgRepresentationRequest"("userId", "organizationId");
CREATE INDEX IF NOT EXISTS "OrgRepresentationRequest_status_idx" ON "OrgRepresentationRequest"("status");
CREATE INDEX IF NOT EXISTS "OrgRepresentationRequest_organizationId_idx" ON "OrgRepresentationRequest"("organizationId");

-- CreateTable Technology
CREATE TABLE IF NOT EXISTS "Technology" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "howItWorks" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" UUID NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "climateAction" "ClimateAction",
    "maturity" "Maturity",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Technology_slug_key" ON "Technology"("slug");
CREATE INDEX IF NOT EXISTS "Technology_status_idx" ON "Technology"("status");
CREATE INDEX IF NOT EXISTS "Technology_organizationId_idx" ON "Technology"("organizationId");

CREATE TABLE IF NOT EXISTS "TechnologyTag" (
    "id" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "TechnologyTag_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TechnologyTag_technologyId_idx" ON "TechnologyTag"("technologyId");
CREATE INDEX IF NOT EXISTS "TechnologyTag_tag_idx" ON "TechnologyTag"("tag");

CREATE TABLE IF NOT EXISTS "TechnologyMedia" (
    "id" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TechnologyMedia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TechnologyMedia_technologyId_idx" ON "TechnologyMedia"("technologyId");

CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "context" TEXT,
    "needType" "NeedType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" UUID NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Challenge_status_idx" ON "Challenge"("status");
CREATE INDEX IF NOT EXISTS "Challenge_organizationId_idx" ON "Challenge"("organizationId");

CREATE TABLE IF NOT EXISTS "ChallengeTag" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "ChallengeTag_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChallengeTag_challengeId_idx" ON "ChallengeTag"("challengeId");

CREATE TABLE IF NOT EXISTS "Project" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" UUID NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Project_slug_key" ON "Project"("slug");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_organizationId_idx" ON "Project"("organizationId");
CREATE INDEX IF NOT EXISTS "Project_type_idx" ON "Project"("type");

-- FKs (ignore if exist)
DO $$ BEGIN
  ALTER TABLE "OrgRepresentationRequest" ADD CONSTRAINT "OrgRepresentationRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "OrgRepresentationRequest" ADD CONSTRAINT "OrgRepresentationRequest_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Technology" ADD CONSTRAINT "Technology_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TechnologyTag" ADD CONSTRAINT "TechnologyTag_technologyId_fkey"
    FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TechnologyMedia" ADD CONSTRAINT "TechnologyMedia_technologyId_fkey"
    FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ChallengeTag" ADD CONSTRAINT "ChallengeTag_challengeId_fkey"
    FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
