-- CreateEnum
CREATE TYPE "OrgPublishKind" AS ENUM ('TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "publishKinds" "OrgPublishKind"[] DEFAULT ARRAY[]::"OrgPublishKind"[];

-- Orgs já existentes: liberar todos os tipos (compatibilidade)
UPDATE "Organization"
SET "publishKinds" = ARRAY['TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE']::"OrgPublishKind"[]
WHERE cardinality("publishKinds") = 0;
