#!/usr/bin/env bash
set -euo pipefail
cd /app/netsys-apps/cac

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
fi
PATH=$(echo "$PATH" | tr ':' '\n' | grep -v '/mnt/c/' | paste -sd: -)
export PATH

REPORT=/app/netsys-apps/cac/_REQUISITOS/_e6-run-log.txt
exec > >(tee "$REPORT") 2>&1

echo "== E6 setup $(date -Iseconds) =="

cp -n .env.prod.example .env.prod || true
# ensure JWT secrets present for api if using .env.prod from example
if [[ -f .env ]]; then
  # keep DB seed working for local migrate too
  set -a; . ./.env; set +a
fi

echo "== seed volumes locally (optional) =="
npm run build -w @cac/shared || true
npm run db:generate -w @cac/api
(cd apps/api && npx prisma migrate deploy)
npm run db:seed -w @cac/api

echo "== bring up prod compose =="
docker compose -f docker-compose.yml stop web www || true
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
echo "waiting for gateway..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8084/health >/dev/null; then
    echo "gateway portal :8084 healthy"
    break
  fi
  sleep 5
done

chmod +x scripts/smoke-marco1.sh scripts/backup-postgres.sh
API_URL=http://localhost:8084 bash scripts/smoke-marco1.sh
curl -sf -o /dev/null -w "gestor :8086 → %{http_code}\n" http://localhost:8086/ || true

echo "== backup sample =="
COMPOSE_FILE=docker-compose.prod.yml bash scripts/backup-postgres.sh ./backups || true

echo "== DONE =="
