#!/usr/bin/env bash
# Sobe www (:5179) e web (:5178) via Vite com o código-fonte atual.
# Para containers Docker nessas portas (build antigo) para evitar confusão de layout.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Parando containers Docker web/www (se existirem)..."
docker compose stop web www 2>/dev/null || true

echo "==> Liberando portas 5178–5181..."
for p in 5178 5179 5180 5181; do
  fuser -k "${p}/tcp" 2>/dev/null || true
done
pkill -f 'vite --port 517' 2>/dev/null || true
sleep 1

echo "==> Subindo Vite..."
echo "    Portal:  http://localhost:5179/"
echo "    Painel:  http://localhost:5178/"
echo "    (Ctrl+C encerra ambos)"
echo ""

npm run dev:www &
WWW_PID=$!
npm run dev:web &
WEB_PID=$!

trap 'kill $WWW_PID $WEB_PID 2>/dev/null || true' EXIT
wait
