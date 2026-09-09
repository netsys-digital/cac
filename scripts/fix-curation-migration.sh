#!/usr/bin/env bash
# Recover from Prisma P3009 on 20260908200000_curation_notes (prod).
# Run on the server from /app/cac (or repo root with compose.prod).
#
# Note: on NETSYS shared Postgres, tables are often owned by `netsys`, not `cac`.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
MIGRATION=20260908200000_curation_notes
PG_CONTAINER="${PG_CONTAINER:-netsys-postgres}"
PG_USER="${PG_USER:-netsys}"
PG_DB="${PG_DB:-cac}"

echo "==> Mark failed migration as rolled back (so deploy can re-apply)"
"${COMPOSE[@]}" run --rm --no-deps api \
  npx prisma migrate resolve --rolled-back "$MIGRATION" || true

echo "==> Ensure columns exist (owner user: ${PG_USER})"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" <<'SQL'
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
SQL

echo "==> Mark migration as applied"
"${COMPOSE[@]}" run --rm --no-deps api \
  npx prisma migrate resolve --applied "$MIGRATION" || true

echo "==> Recreate api + gateway"
"${COMPOSE[@]}" up -d --no-deps --force-recreate api
sleep 12
"${COMPOSE[@]}" up -d --no-deps --force-recreate gateway

echo "==> Status"
"${COMPOSE[@]}" ps
curl -s -o /dev/null -w "8084/health=%{http_code}\n" http://127.0.0.1:8084/health || true
curl -s -o /dev/null -w "8086/=%{http_code}\n" http://127.0.0.1:8086/ || true
