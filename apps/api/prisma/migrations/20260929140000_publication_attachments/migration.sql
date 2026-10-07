-- Galeria (até 20 imagens) e Outros documentos (até 10 arquivos) por publicação
DO $$ BEGIN
  CREATE TYPE "AttachmentKind" AS ENUM ('GALLERY', 'DOCUMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PublicationAttachment" (
  "id" UUID NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" UUID NOT NULL,
  "kind" "AttachmentKind" NOT NULL,
  "url" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicationAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PublicationAttachment_entityType_entityId_kind_idx"
  ON "PublicationAttachment"("entityType", "entityId", "kind");
