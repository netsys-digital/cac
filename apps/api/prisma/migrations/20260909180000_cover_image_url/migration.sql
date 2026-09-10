-- Representative cover image for catalog publications
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
