#!/usr/bin/env bash
# Recovery one-shot for CAC production (run from WSL with key ~/NETSYS_HETZNER)
set -euo pipefail
KEY="${SSH_KEY:-$HOME/NETSYS_HETZNER}"
HOST="${SSH_HOST:-root@77.42.127.221}"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$HOST")
REPO=/app/netsys-apps/cac
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

echo "==> DDL + ownership"
"${SSH[@]}" "docker exec -i netsys-postgres psql -U netsys -d cac" <<'SQL'
ALTER TABLE "Technology" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
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

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP EXECUTE format('ALTER TABLE public.%I OWNER TO cac', r.tablename); END LOOP;
  FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  LOOP EXECUTE format('ALTER SEQUENCE public.%I OWNER TO cac', r.sequencename); END LOOP;
END $$;

ALTER SCHEMA public OWNER TO cac;
GRANT ALL ON SCHEMA public TO cac;
GRANT ALL ON ALL TABLES IN SCHEMA public TO cac;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO cac;

SELECT tableowner FROM pg_tables WHERE tablename='Technology';
SELECT column_name FROM information_schema.columns
 WHERE table_name='Technology' AND column_name IN ('videoUrl','curationNote')
 ORDER BY 1;
SQL

echo "==> Resolve migrations"
"${SSH[@]}" "cd $REPO && $COMPOSE run --rm --no-deps --entrypoint '' api \
  npx prisma migrate resolve --rolled-back 20260909010000_technology_video_url" || true
"${SSH[@]}" "cd $REPO && $COMPOSE run --rm --no-deps --entrypoint '' api \
  npx prisma migrate resolve --applied 20260909010000_technology_video_url" || true
"${SSH[@]}" "cd $REPO && $COMPOSE run --rm --no-deps --entrypoint '' api \
  npx prisma migrate resolve --applied 20260908200000_curation_notes" || true

# Fallback if entrypoint flag unsupported
"${SSH[@]}" "cd $REPO && $COMPOSE run --rm --no-deps api \
  sh -c 'npx prisma migrate resolve --applied 20260909010000_technology_video_url || true; npx prisma migrate resolve --applied 20260908200000_curation_notes || true'" || true

echo "==> Recreate API"
"${SSH[@]}" "cd $REPO && $COMPOSE up -d --no-deps --force-recreate api"

echo "==> Wait health"
for i in $(seq 1 40); do
  code=$("${SSH[@]}" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8084/health" || echo err)
  echo "  try $i: /health=$code"
  [[ "$code" == "200" ]] && break
  sleep 3
done

"${SSH[@]}" 'docker ps --filter name=cac-api --format "{{.Names}} {{.Status}}"; curl -s -o /dev/null -w "8084/health=%{http_code} 8084/=%{http_code} 8086/=%{http_code}\n" http://127.0.0.1:8084/health http://127.0.0.1:8084/ http://127.0.0.1:8086/'

echo "DONE"
