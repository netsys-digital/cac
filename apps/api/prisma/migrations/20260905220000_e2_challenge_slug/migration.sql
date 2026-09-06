-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN "slug" TEXT;

-- Backfill existing rows
UPDATE "Challenge" SET "slug" = CONCAT('challenge-', REPLACE("id"::text, '-', '')) WHERE "slug" IS NULL;

-- AlterTable
ALTER TABLE "Challenge" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
