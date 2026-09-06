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

REPORT=/app/netsys-apps/cac/_REQUISITOS/_e5-run-log.txt
exec > >(tee "$REPORT") 2>&1

echo "== E5 setup $(date -Iseconds) =="
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi

npm run build -w @cac/shared
npm run db:generate -w @cac/api
(cd apps/api && npx prisma migrate deploy)
npm run db:seed -w @cac/api

docker compose up -d --build api api-worker
sleep 10

npm run test -w @cac/api
npm run build -w @cac/web
npm run build -w @cac/www

echo "== smoke =="
curl -sS http://localhost:3003/api/funding-offers?active=true | python3 -c 'import sys,json; d=json.load(sys.stdin); print("offers",len(d["items"]))'
curl -sS http://localhost:3003/api/success-cases | python3 -c 'import sys,json; d=json.load(sys.stdin); print("cases",[i["slug"] for i in d["items"]])'
curl -sS -X POST http://localhost:3003/api/search -H 'Content-Type: application/json' \
  -d '{"query":"recuperação de pastagens em seca"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print("whoCanFund",d["paths"]["whoCanFund"]); print("kinds",set(x["kind"] for x in d["paths"]["whoCanFund"]))'

cat > /app/netsys-apps/cac/_REQUISITOS/aceite-e5-run.md <<'EOF'
# Aceite E5 — execução

Ver log `_e5-run-log.txt`.
EOF

echo "== DONE =="
