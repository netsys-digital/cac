#!/usr/bin/env bash
# Diagnose + apply banner position fix (migration already in prisma/).
set -euo pipefail
cd /app/netsys-apps/cac

echo "=== 1. compose ps ==="
docker compose ps -a

echo "=== 2. build @cac/shared ==="
npm run build -w @cac/shared

echo "=== 3. rebuild api + api-worker ==="
docker compose build api api-worker
docker compose up -d api api-worker

echo "=== 4. wait for api ==="
for i in $(seq 1 60); do
  if docker compose exec -T api sh -c 'true' 2>/dev/null; then
    break
  fi
  sleep 2
done
sleep 5

echo "=== 5. shared schema in container ==="
docker compose exec -T api sh -c 'grep -n technologyBannerPosition /app/packages/shared/dist/schemas/representation.js | head' || true
docker compose exec -T api sh -c 'grep -n BannerPosition /app/packages/shared/dist/enums.js | head' || true

echo "=== 6. DB columns ==="
docker compose exec -T postgres psql -U cac -d cac -c \
  'SELECT "technologyBannerPosition", "challengeBannerPosition", "fundingOfferBannerPosition", "successCaseBannerPosition" FROM "Organization" LIMIT 3;'

echo "=== 7. write/read via prisma in api ==="
docker compose exec -T api node --input-type=module -e '
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const org = await prisma.organization.findFirst({ select: { id: true, technologyBannerPosition: true } });
if (!org) { console.log("no org"); process.exit(1); }
const next = org.technologyBannerPosition === "ABOVE_HERO" ? "BELOW_HERO" : "ABOVE_HERO";
const updated = await prisma.organization.update({
  where: { id: org.id },
  data: { technologyBannerPosition: next },
  select: { id: true, technologyBannerPosition: true, challengeBannerPosition: true },
});
console.log(JSON.stringify({ before: org, after: updated }, null, 2));
await prisma.$disconnect();
'

echo "=== DONE ==="
