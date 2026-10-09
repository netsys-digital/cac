-- Visualizações de publicações no portal (uma por visitante anônimo por dia)
CREATE TABLE IF NOT EXISTS "ContentView" (
  "id" UUID NOT NULL,
  "targetType" "ConnectionTargetType" NOT NULL,
  "targetId" UUID NOT NULL,
  "visitorHash" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentView_targetType_targetId_visitorHash_day_key"
  ON "ContentView"("targetType", "targetId", "visitorHash", "day");
CREATE INDEX IF NOT EXISTS "ContentView_targetId_idx" ON "ContentView"("targetId");
