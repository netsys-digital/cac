#!/usr/bin/env bash
# Prepara o schema CAC no Postgres compartilhado NETSYS antes do migrate da API.
#
# Problema recorrente: tabelas são OWNER netsys; DATABASE_URL usa user cac.
# Prisma migrate deploy (ALTER) falha com 42501 → P3009 → API em crash-loop → site sem /api.
#
# Este script:
# 1) aplica DDL idempotente como netsys
# 2) transfere ownership do schema public para cac (migrate futuro funciona)
# 3) marca migrações conhecidas como applied quando o DDL já existe
#
# Uso (no servidor, a partir da raiz do repo):
#   bash scripts/prod-db-prepare.sh
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
PG_CONTAINER="${PG_CONTAINER:-netsys-postgres}"
PG_USER="${PG_USER:-netsys}"
PG_DB="${PG_DB:-cac}"
APP_DB_USER="${APP_DB_USER:-cac}"

if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  echo "Container Postgres não encontrado: $PG_CONTAINER"
  exit 1
fi

echo "==> DDL idempotente (user ${PG_USER})"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" <<'SQL'
-- curation notes (20260908200000)
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "curationNote" TEXT;
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "curationNote" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "curationNote" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "curationNote" TEXT;
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "curationNote" TEXT;
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

-- video URL (20260909010000)
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

-- org publish kinds (20260909230000)
DO $$ BEGIN
  CREATE TYPE "OrgPublishKind" AS ENUM ('TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "publishKinds" "OrgPublishKind"[]
  DEFAULT ARRAY[]::"OrgPublishKind"[];

UPDATE "Organization"
SET "publishKinds" = ARRAY['TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE']::"OrgPublishKind"[]
WHERE "publishKinds" IS NULL OR cardinality("publishKinds") = 0;
SQL

echo "==> Ownership → ${APP_DB_USER} (para prisma migrate deploy não falhar de novo)"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" <<SQL
DO \$\$
DECLARE
  r RECORD;
BEGIN
  -- tables
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO %I', r.tablename, '${APP_DB_USER}');
  END LOOP;

  -- sequences
  FOR r IN
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO %I', r.sequencename, '${APP_DB_USER}');
  END LOOP;

  -- views
  FOR r IN
    SELECT viewname FROM pg_views WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER VIEW public.%I OWNER TO %I', r.viewname, '${APP_DB_USER}');
  END LOOP;
END
\$\$;

ALTER SCHEMA public OWNER TO ${APP_DB_USER};
GRANT ALL ON SCHEMA public TO ${APP_DB_USER};
GRANT ALL ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_DB_USER};
SQL

echo "==> Resolve migrações falhas / marca applied quando DDL já existe"
# --entrypoint '' evita o entrypoint antigo (migrate+seed+node) que nunca sai.
# Com entrypoint novo (args → exec), ainda funciona e é mais seguro.
resolve_applied() {
  local name="$1"
  echo "  resolve ${name}…"
  "${COMPOSE[@]}" run --rm --no-deps --entrypoint '' api \
    npx prisma migrate resolve --rolled-back "$name" || true
  "${COMPOSE[@]}" run --rm --no-deps --entrypoint '' api \
    npx prisma migrate resolve --applied "$name" || true
  echo "  resolved: $name"
}

# Só resolve se a imagem/api existir; senão o deploy sobe a api depois.
if "${COMPOSE[@]}" images api 2>/dev/null | grep -q api \
  || docker image ls --format '{{.Repository}}' | grep -qE 'cac[-_]api'; then
  resolve_applied "20260908200000_curation_notes"
  resolve_applied "20260909010000_technology_video_url"
  resolve_applied "20260909230000_org_publish_kinds"
else
  echo "  (skip resolve — imagem api ainda não existe; migrate deploy cuidará após o build)"
fi

echo "==> Verifica colunas críticas"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name='Technology' AND column_name IN ('curationNote','videoUrl','reviewedAt') ORDER BY 1;"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name='Organization' AND column_name='publishKinds';"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
  "SELECT COUNT(*) AS organizations FROM \"Organization\";"

echo "OK — schema preparado para user ${APP_DB_USER}"
