-- Click-through URL for promotional banners
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "technologyBannerLinkUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "challengeBannerLinkUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "fundingOfferBannerLinkUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "successCaseBannerLinkUrl" TEXT;

ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "bannerLinkUrl" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "bannerLinkUrl" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "bannerLinkUrl" TEXT;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "bannerLinkUrl" TEXT;
