#!/usr/bin/env bash
# Rebuild da API Docker para pegar endpoints novos (ex.: vínculos da org).
set -euo pipefail
cd /app/netsys-apps/cac
echo "==> build api (no cache)"
docker compose build --no-cache api api-worker
echo "==> up api"
docker compose up -d api api-worker
echo "==> wait"
sleep 4
docker compose logs --tail=25 api
echo "==> done"
