-- Optional related video URL on published solutions
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
