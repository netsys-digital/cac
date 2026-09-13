-- Banner placement on detail pages
DO $$ BEGIN
  CREATE TYPE "BannerPosition" AS ENUM ('ABOVE_HERO', 'BELOW_HERO', 'ABOVE_FOOTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "technologyBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "challengeBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "fundingOfferBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "successCaseBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';

ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
