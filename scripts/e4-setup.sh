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

REPORT=/tmp/cac-e4-setup.txt
exec > >(tee "$REPORT") 2>&1

echo "== E4 setup $(date -Iseconds) =="
if [[ -f .env ]]; then
  grep -q '^SMTP_FROM_EMAIL=' .env || echo 'SMTP_FROM_EMAIL=noreply@climateactionconnect.org' >> .env
  set -a; . ./.env; set +a
fi

echo "== install nodemailer =="
npm install -w @cac/api nodemailer@^7.0.5
npm install -w @cac/api -D @types/nodemailer@^6.4.17

echo "== build shared =="
npm run build -w @cac/shared

echo "== prisma =="
npm run db:generate -w @cac/api
(cd apps/api && npx prisma migrate deploy)

echo "== docker rebuild api =="
docker compose up -d --build api api-worker
sleep 10

echo "== tests =="
npm run test -w @cac/api

echo "== build web + www =="
npm run build -w @cac/web
npm run build -w @cac/www

echo "== smoke =="
curl -sS http://localhost:3003/health
echo
TOKEN=$(curl -sS -X POST http://localhost:3003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cac.local","password":"Admin123!"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')
curl -sS http://localhost:3003/api/admin/kpis -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30
curl -sS http://localhost:3003/api/admin/pending -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("pending",len(d.get("items",[])))'

echo "== DONE =="
