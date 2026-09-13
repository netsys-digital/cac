#!/usr/bin/env bash
set -euo pipefail
cd /app/netsys-apps/cac

echo "== migrations =="
ls apps/api/prisma/migrations/ | tail -25

MIG=apps/api/prisma/migrations/20260913010000_banner_position
if [[ ! -f "$MIG/migration.sql" ]]; then
  echo "== creating missing migration =="
  mkdir -p "$MIG"
  cat > "$MIG/migration.sql" <<'SQL'
-- Banner placement on detail pages
DO $$ BEGIN
  CREATE TYPE "BannerPosition" AS ENUM ('ABOVE_HERO', 'BELOW_HERO', 'ABOVE_FOOTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "technologyBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "challengeBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "fundingOfferBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "successCaseBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';

ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
SQL
else
  echo "== migration file OK =="
  # harden against re-run if enum already exists
  if ! grep -q 'duplicate_object' "$MIG/migration.sql"; then
    cat > "$MIG/migration.sql" <<'SQL'
-- Banner placement on detail pages
DO $$ BEGIN
  CREATE TYPE "BannerPosition" AS ENUM ('ABOVE_HERO', 'BELOW_HERO', 'ABOVE_FOOTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "technologyBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "challengeBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "fundingOfferBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "successCaseBannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';

ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "FundingOffer" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
ALTER TABLE "SuccessCase" ADD COLUMN IF NOT EXISTS "bannerPosition" "BannerPosition" NOT NULL DEFAULT 'ABOVE_FOOTER';
SQL
  fi
fi

echo "== build shared =="
npm run build -w @cac/shared

echo "== postgres up =="
docker compose up -d postgres redis

echo "== wait postgres =="
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U cac -d cac >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "== migrate deploy =="
docker compose run --rm --no-deps \
  -v /app/netsys-apps/cac/apps/api/prisma:/app/apps/api/prisma \
  -e DATABASE_URL=postgresql://cac:cac_secret@postgres:5432/cac \
  api npx prisma migrate deploy

echo "== columns =="
docker compose exec -T postgres psql -U cac -d cac -c \
  "SELECT column_name FROM information_schema.columns WHERE column_name LIKE '%annerPosition%' ORDER BY 1;"

echo "== rebuild api =="
docker compose build api api-worker
docker compose up -d api api-worker

echo "== wait api =="
sleep 8
docker compose ps api

echo "== shared in image =="
docker compose exec -T api sh -c 'grep -n technologyBannerPosition /app/packages/shared/dist/schemas/representation.js | head -3' || true

echo "== write/read test =="
docker compose exec -T api node --input-type=module <<'NODE'
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const org = await p.organization.findFirst();
  if (!org) {
    console.log('no org to test');
    process.exit(0);
  }
  const u = await p.organization.update({
    where: { id: org.id },
    data: { technologyBannerPosition: 'ABOVE_HERO' },
  });
  console.log('write OK:', u.technologyBannerPosition);
  await p.organization.update({
    where: { id: org.id },
    data: { technologyBannerPosition: 'ABOVE_FOOTER' },
  });
  console.log('reset OK');
} catch (e) {
  console.error('WRITE FAIL', e);
  process.exit(1);
} finally {
  await p.$disconnect();
}
NODE

echo "== DONE =="
