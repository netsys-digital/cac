-- Organization banners per authorized publish kind
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "technologyBannerUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "challengeBannerUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "fundingOfferBannerUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "successCaseBannerUrl" TEXT;

-- Publication banners (override org banner when set)
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "bannerImageUrl" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "bannerImageUrl" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "bannerImageUrl" TEXT;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "bannerImageUrl" TEXT;
