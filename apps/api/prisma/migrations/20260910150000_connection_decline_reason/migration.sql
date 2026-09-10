-- Justificativa obrigatória ao recusar conexão
ALTER TABLE "Connection" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;
