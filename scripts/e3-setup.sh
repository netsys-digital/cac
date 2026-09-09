#!/usr/bin/env bash
set -euo pipefail
cd /app/netsys-apps/cac

# Ensure Linux Node via nvm (non-interactive shells skip ~/.bashrc)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
fi
# Drop Windows Node from PATH so npm scripts do not invoke cmd.exe
PATH=$(echo "$PATH" | tr ':' '\n' | grep -v '/mnt/c/' | paste -sd: -)
export PATH
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found after loading nvm" >&2
  exit 1
fi
echo "Using node=$(command -v node) $(node -v) npm=$(command -v npm)"

REPORT=/tmp/cac-e3-setup.txt
exec > >(tee "$REPORT") 2>&1

echo "== E3 setup $(date -Iseconds) =="

# env
if [[ -f .env ]]; then
  grep -q '^OFFLINE_MODE=' .env && sed -i 's/^OFFLINE_MODE=.*/OFFLINE_MODE=true/' .env || echo 'OFFLINE_MODE=true' >> .env
  grep -q '^SCORE_WEIGHTS=' .env || echo 'SCORE_WEIGHTS=semantic:40,tags:25,region:15,maturity:10,need:10' >> .env
  grep -q '^MATCH_MIN_SCORE=' .env || echo 'MATCH_MIN_SCORE=5' >> .env
  echo "OK env"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "WARN no .env — using .env.example defaults via dotenv"
fi

echo "== build shared =="
npm run build -w @cac/shared

echo "== prisma generate + migrate =="
npm run db:generate -w @cac/api
(cd apps/api && npx prisma migrate deploy)

echo "== seed =="
npm run db:seed -w @cac/api

echo "== docker rebuild api =="
docker compose up -d --build api api-worker
sleep 8

echo "== tests =="
npm run test -w @cac/api

echo "== build www =="
npm run build -w @cac/www

echo "== smoke search =="
curl -sS -X POST http://localhost:3003/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"recuperação de pastagens em seca","lang":"pt"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("scores",[r["score"] for r in d["results"][:5]]); print("factors",len(d["results"][0]["factors"]) if d["results"] else 0); print("paths",list(d["paths"].keys())); print("interp",d["interpretation"])'

echo "== DONE =="
echo "Report also at $REPORT"
