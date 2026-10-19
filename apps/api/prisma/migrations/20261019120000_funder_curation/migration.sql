-- Public funder submissions go through curation, like other catalog content.
ALTER TABLE "FunderProfile" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "FunderProfile" ADD COLUMN IF NOT EXISTS "submittedByUserId" UUID;
ALTER TABLE "FunderProfile" ADD COLUMN IF NOT EXISTS "curationNote" TEXT;
ALTER TABLE "FunderProfile" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "FunderProfile_submittedByUserId_idx" ON "FunderProfile"("submittedByUserId");

DO $$ BEGIN
  ALTER TABLE "FunderProfile"
    ADD CONSTRAINT "FunderProfile_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
