-- CreateTable
CREATE TABLE "ContentTranslation" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentTranslation_entityType_entityId_field_lang_key" ON "ContentTranslation"("entityType", "entityId", "field", "lang");

-- CreateIndex
CREATE INDEX "ContentTranslation_entityType_entityId_lang_idx" ON "ContentTranslation"("entityType", "entityId", "lang");

-- CreateIndex
CREATE INDEX "ContentTranslation_sourceHash_lang_idx" ON "ContentTranslation"("sourceHash", "lang");
