-- AlterTable
ALTER TABLE "OrgRepresentationRequest" ADD COLUMN "proofDocument1Url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrgRepresentationRequest" ADD COLUMN "proofDocument2Url" TEXT;

-- Drop default after backfill of existing rows
ALTER TABLE "OrgRepresentationRequest" ALTER COLUMN "proofDocument1Url" DROP DEFAULT;
