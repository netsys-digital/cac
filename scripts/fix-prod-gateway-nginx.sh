#!/usr/bin/env bash
# Aplica nginx.conf corrigido no servidor de produção e recria o gateway.
set -euo pipefail
KEY="${SSH_KEY:-}"
for k in \
  "${SSH_KEY:-}" \
  "$HOME/NETSYS_HETZNER" \
  "$HOME/.ssh/NETSYS_HETZNER" \
  "$HOME/NETSYS_SERVER_2026_05.pem" \
  "$HOME/.ssh/id_rsa"
do
  [[ -n "$k" && -f "$k" ]] && KEY="$k" && break
done

HOST="${SSH_HOST:-root@77.42.127.221}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF="$ROOT/deploy/nginx/nginx.conf"

if [[ ! -f "$CONF" ]]; then
  echo "Falta $CONF"
  exit 1
fi

SSH=(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
SCP=(scp -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
if [[ -n "$KEY" ]]; then
  SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
  SCP=(scp -i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
  echo "KEY=$KEY"
else
  echo "Sem chave explícita — tentando agent/default"
fi

echo "==> Envia nginx.conf → $HOST:/app/cac/deploy/nginx/nginx.conf"
"${SCP[@]}" "$CONF" "$HOST:/app/cac/deploy/nginx/nginx.conf"

echo "==> Recreate gateway + smoke API"
"${SSH[@]}" "$HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
cd /app/cac
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate --no-deps gateway
sleep 2
echo "--- health ---"
curl -sS http://127.0.0.1:8084/health; echo
echo "--- api technologies (head) ---"
curl -sS http://127.0.0.1:8084/api/technologies | head -c 220; echo
echo "--- login curator ---"
curl -sS -X POST http://127.0.0.1:8084/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"curador@cac.local","password":"Curador123!"}' | head -c 280; echo
echo "--- JS ctype ---"
JS=$(curl -sS http://127.0.0.1:8084/ | grep -oE '/assets/[^"]+\.js' | head -1)
curl -sS -o /dev/null -w "JS %{http_code} %{content_type}\n" "http://127.0.0.1:8084$JS"
REMOTE

echo "OK"
