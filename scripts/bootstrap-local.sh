#!/usr/bin/env bash
# Bootstrap do ambiente LOCAL (WSL) a partir dos examples.
# Uso: bash scripts/bootstrap-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Criado .env a partir de .env.example"
else
  echo ".env já existe — mantido"
fi

if [[ ! -f .env.prod ]]; then
  cp .env.prod.example .env.prod
  echo "Criado .env.prod a partir de .env.prod.example (só referência local; não sobe stack prod sem rede netsys)"
else
  echo ".env.prod já existe — mantido"
fi

echo
echo "Próximos passos (dev):"
echo "  docker compose up -d postgres redis libretranslate api api-worker"
echo "  docker compose stop web www    # libera 5178/5179 para Vite"
echo "  npm install"
echo "  npm run db:migrate -w @cac/api"
echo "  npm run db:seed -w @cac/api"
echo "  bash scripts/dev-frontends.sh  # ou npm run dev:www / npm run dev:web"
echo
echo "Produção (no servidor /app/cac, após commit/push):"
echo "  bash scripts/install-prod.sh"
echo "  # ou wipe total do schema: bash scripts/install-prod.sh --wipe-db"
