#!/usr/bin/env bash
# Diagnóstico rápido de página em branco — rodar NO SERVIDOR em /app/cac
# Uso: bash scripts/prod-blank-diag.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== HOST / GIT ==="
hostname
git rev-parse --short HEAD 2>/dev/null || echo "no-git"
pwd
df -h / | tail -1
free -h | head -2

echo
echo "=== DOCKER cac-* ==="
docker ps -a --filter name=cac- --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo
echo "=== LOCALHOST HTML + ASSETS ==="
for p in 8084 8086; do
  echo "--- :$p/"
  curl -sS -o "/tmp/cac-$p.html" -w "HTTP %{http_code} ctype=%{content_type} size=%{size_download}\n" \
    --max-time 10 "http://127.0.0.1:$p/" || echo "curl fail"
  head -n 30 "/tmp/cac-$p.html" || true
  JS=$(grep -oE '/assets/[^"]+\.js' "/tmp/cac-$p.html" | head -1 || true)
  CSS=$(grep -oE '/assets/[^"]+\.css' "/tmp/cac-$p.html" | head -1 || true)
  echo "JS=$JS CSS=$CSS"
  if [[ -n "${JS:-}" ]]; then
    curl -sS -o /tmp/cac-asset.js -w "JS HTTP %{http_code} ctype=%{content_type} size=%{size_download}\n" \
      --max-time 10 "http://127.0.0.1:$p$JS" || true
    head -c 80 /tmp/cac-asset.js; echo
    if grep -q 'localhost:5178' /tmp/cac-asset.js 2>/dev/null; then
      echo "FAIL: JS contém localhost:5178 (build sem PUBLIC_* / precisa rebuild --full)"
    fi
    if head -c 20 /tmp/cac-asset.js | grep -qi '<!DOCTYPE\|<html'; then
      echo "FAIL: JS retornou HTML (try_files/fallback — asset path quebrado)"
    fi
  else
    echo "FAIL: nenhum /assets/*.js no HTML"
  fi
  if [[ -n "${CSS:-}" ]]; then
    curl -sS -o /dev/null -w "CSS HTTP %{http_code} ctype=%{content_type}\n" \
      --max-time 10 "http://127.0.0.1:$p$CSS" || true
  fi
done

echo
echo "=== HEALTH ==="
curl -sS -w "\nhealth HTTP %{http_code}\n" --max-time 8 http://127.0.0.1:8084/health || true

echo
echo "=== LOGS (tail) ==="
for c in cac-api-1 cac-web-1 cac-www-1 cac-gateway-1; do
  echo "---- $c ----"
  docker logs "$c" --tail 25 2>&1 || true
done

echo
echo "=== INDEX nos containers ==="
docker exec cac-web-1 cat /usr/share/nginx/html/index.html 2>/dev/null | head -25 || true
echo "----"
docker exec cac-www-1 cat /usr/share/nginx/html/index.html 2>/dev/null | head -25 || true

echo
echo "DONE. Se JS=FAIL ou containers unhealthy: bash deploy.sh --full"
