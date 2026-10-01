-- Technical sheet fields on solutions (sidebar of the public detail page)
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "developedWithPartners" BOOLEAN;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "partnerInstitutions" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "methodology" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "launchYear" INTEGER;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "biome" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "responsibleUnit" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "accessInfo" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "officialUrl" TEXT;
