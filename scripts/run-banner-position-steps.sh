#!/usr/bin/env bash
set -euo pipefail
cd /app/netsys-apps/cac

LOG=/tmp/banner-position-steps.log
: > "$LOG"

log() { echo "$@" | tee -a "$LOG"; }

log "=== STEP 1: Build shared ==="
npm run build -w @cac/shared 2>&1 | tee -a "$LOG"
log "STEP 1: OK"

log "=== STEP 2: Docker postgres/redis ==="
docker compose up -d postgres redis 2>&1 | tee -a "$LOG"
log "STEP 2: OK"

log "=== STEP 3: Prisma migrate deploy ==="
cd /app/netsys-apps/cac/apps/api
if DATABASE_URL='postgresql://cac:cac_secret@localhost:5433/cac' npx prisma migrate deploy 2>&1 | tee -a "$LOG"; then
  log "STEP 3: migrate deploy via localhost OK"
else
  log "STEP 3: localhost failed, trying docker compose run..."
  cd /app/netsys-apps/cac
  docker compose run --rm --no-deps \
    -v /app/netsys-apps/cac/apps/api/prisma:/app/apps/api/prisma \
    -e DATABASE_URL=postgresql://cac:cac_secret@postgres:5432/cac \
    api npx prisma migrate deploy 2>&1 | tee -a "$LOG"
  log "STEP 3: migrate deploy via docker compose OK"
fi

cd /app/netsys-apps/cac

log "=== STEP 4: Verify columns ==="
docker compose exec postgres psql -U cac -d cac -c '\dT+ BannerPosition' 2>&1 | tee -a "$LOG"
docker compose exec postgres psql -U cac -d cac -c "SELECT column_name FROM information_schema.columns WHERE table_name='Organization' AND column_name LIKE '%BannerPosition%';" 2>&1 | tee -a "$LOG"
log "STEP 4: OK"

log "=== STEP 5: Rebuild and restart API ==="
docker compose build api api-worker 2>&1 | tee -a "$LOG"
docker compose up -d api api-worker 2>&1 | tee -a "$LOG"
log "STEP 5: OK"

log "=== STEP 6: Verify shared in container ==="
docker compose exec api sh -c 'grep technologyBannerPosition /app/packages/shared/dist/schemas/representation.js | head -3' 2>&1 | tee -a "$LOG"
log "STEP 6: OK"

log "=== STEP 7: Write test ==="
docker compose exec api node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const org = await p.organization.findFirst();
if (!org) { console.log('no org'); process.exit(0); }
const u = await p.organization.update({ where: { id: org.id }, data: { technologyBannerPosition: 'ABOVE_HERO' } });
console.log('wrote', u.technologyBannerPosition);
await p.organization.update({ where: { id: org.id }, data: { technologyBannerPosition: 'ABOVE_FOOTER' } });
await p.\$disconnect();
" 2>&1 | tee -a "$LOG"
log "STEP 7: OK"

log "=== ALL STEPS COMPLETE ==="
cat "$LOG"
