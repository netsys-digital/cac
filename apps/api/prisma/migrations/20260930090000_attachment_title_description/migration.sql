-- Título e descrição opcionais por imagem da galeria / documento de apoio
ALTER TABLE "PublicationAttachment" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "PublicationAttachment" ADD COLUMN IF NOT EXISTS "description" TEXT;
