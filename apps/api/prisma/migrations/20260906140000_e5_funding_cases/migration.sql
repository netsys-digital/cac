-- E5: enrich FundingOffer + SuccessCase
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "whatFunds" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "criteria" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "amountRange" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "officialUrl" TEXT;

CREATE TABLE IF NOT EXISTS "SuccessCase" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "context" TEXT,
    "outcomes" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "organizationId" UUID NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SuccessCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SuccessCase_slug_key" ON "SuccessCase"("slug");
CREATE INDEX IF NOT EXISTS "SuccessCase_status_idx" ON "SuccessCase"("status");
CREATE INDEX IF NOT EXISTS "SuccessCase_organizationId_idx" ON "SuccessCase"("organizationId");
CREATE INDEX IF NOT EXISTS "SuccessCase_country_idx" ON "SuccessCase"("country");
CREATE INDEX IF NOT EXISTS "SuccessCase_region_idx" ON "SuccessCase"("region");

CREATE TABLE IF NOT EXISTS "SuccessCaseMedia" (
    "id" UUID NOT NULL,
    "successCaseId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SuccessCaseMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SuccessCaseMedia_successCaseId_idx" ON "SuccessCaseMedia"("successCaseId");

CREATE TABLE IF NOT EXISTS "SuccessCaseNeed" (
    "id" UUID NOT NULL,
    "successCaseId" UUID NOT NULL,
    "needType" "NeedType" NOT NULL,
    "detail" TEXT,
    CONSTRAINT "SuccessCaseNeed_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SuccessCaseNeed_successCaseId_idx" ON "SuccessCaseNeed"("successCaseId");

DO $$ BEGIN
  ALTER TABLE "SuccessCase" ADD CONSTRAINT "SuccessCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SuccessCaseMedia" ADD CONSTRAINT "SuccessCaseMedia_successCaseId_fkey" FOREIGN KEY ("successCaseId") REFERENCES "SuccessCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "SuccessCaseNeed" ADD CONSTRAINT "SuccessCaseNeed_successCaseId_fkey" FOREIGN KEY ("successCaseId") REFERENCES "SuccessCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
