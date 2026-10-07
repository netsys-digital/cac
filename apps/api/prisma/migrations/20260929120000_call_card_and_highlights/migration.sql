-- Card de chamada (imagem/título/resumo) em todas as publicações
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "cardImageUrl" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "cardTitle" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "cardSummary" TEXT;

ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "cardImageUrl" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "cardTitle" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "cardSummary" TEXT;

ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "cardImageUrl" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "cardTitle" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "cardSummary" TEXT;

ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "cardImageUrl" TEXT;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "cardTitle" TEXT;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "cardSummary" TEXT;

-- Ordem no bloco "Destaques da plataforma" da home (NULL = fora dos destaques)
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "highlightOrder" INTEGER;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "highlightOrder" INTEGER;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "highlightOrder" INTEGER;
