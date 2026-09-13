#!/usr/bin/env bash
# ============================================================================
# CAC — publicação SÓ de layout (fronts)
#
# Use quando o ajuste é CSS/UI/tipografia/assets nos apps web/www.
# NÃO toca em: Postgres, migrations, API, api-worker, LibreTranslate.
#
# Fluxo:
#   1. dev local: git add / commit / push
#   2. servidor:  cd /app/cac && bash publish-layout.sh
#
# O que este script faz:
#   * trava (mesmo lock do publish completo — evita deploy paralelo)
#   * confere .env.prod (URLs + tipografia bakeada no Vite)
#   * git fetch + reset --hard origin/main
#   * build --no-cache de web + www
#   * up -d --force-recreate www web gateway
#   * smoke test (portal/gestor + assets JS)
#
# Para deploy completo (API/DB/worker): bash publish.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)

log() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
err() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*" >&2; }

# ----- pré-requisitos --------------------------------------------------------
if [[ ! -f .env.prod ]]; then
  err "Falta .env.prod em $(pwd) (copie de .env.prod.example e ajuste os secrets)."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env.prod
set +a

PORTAL_PORT="${GATEWAY_PORT_PORTAL:-8084}"
GESTOR_PORT="${GATEWAY_PORT_GESTOR:-8086}"

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    err "Variável obrigatória ausente em .env.prod: ${name}"
    exit 1
  fi
}

log "Confere .env.prod (layout)"
require_var PUBLIC_WWW_URL
require_var PUBLIC_WEB_URL

for k in VITE_FONT_EXTRA_GRANDE VITE_FONT_GRANDE VITE_FONT_MEDIA VITE_FONT_PEQUENA VITE_FONT_MINI; do
  if [[ -z "${!k:-}" ]]; then
    warn "${k} ausente em .env.prod — build usará default do compose (pode divergir do local)."
  fi
done

mkdir -p /var/lock
exec 9>/var/lock/cac-publish.lock
if ! flock -n 9; then
  err "Outra publicação já está rodando. Aguarde ou libere /var/lock/cac-publish.lock."
  exit 1
fi

# ----- 1) git pull limpo -----------------------------------------------------
log "Atualiza código (branch: ${BRANCH})"
OLD_SHA="$(git rev-parse HEAD 2>/dev/null || echo '-')"
git fetch origin --prune
git reset --hard "origin/${BRANCH}"
NEW_SHA="$(git rev-parse HEAD)"
echo "  ${OLD_SHA:0:7} → ${NEW_SHA:0:7}"

set -a
# shellcheck disable=SC1091
source ./.env.prod
set +a
PORTAL_PORT="${GATEWAY_PORT_PORTAL:-8084}"
GESTOR_PORT="${GATEWAY_PORT_GESTOR:-8086}"

# ----- 2) build só dos fronts ------------------------------------------------
log "Build imagens (web, www) — --no-cache (PUBLIC_* + VITE_FONT_*)"
"${COMPOSE[@]}" build --no-cache web www

# ----- 3) recreate fronts + gateway ------------------------------------------
log "Recreate www, web"
"${COMPOSE[@]}" up -d --no-deps --force-recreate www web

log "Recreate gateway (nginx)"
"${COMPOSE[@]}" up -d --no-deps --force-recreate gateway

docker image prune -f >/dev/null

# ----- 4) smoke test (só UI) -------------------------------------------------
log "Smoke test (layout)"
fail=0
check() {
  local url="$1" label="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
  if [[ "$code" == "200" ]]; then
    echo "  ${label} (${url}) → 200"
  else
    echo "  FAIL ${label} (${url}) → ${code:-erro}"
    fail=1
  fi
}
check "http://127.0.0.1:${PORTAL_PORT}/" "portal"
check "http://127.0.0.1:${GESTOR_PORT}/" "gestor"

check_assets() {
  local port="$1" label="$2"
  local html js ctype
  html="$(mktemp)"
  js="$(mktemp)"
  curl -sS --max-time 15 -o "$html" "http://127.0.0.1:${port}/" || true
  local asset
  asset="$(grep -oE '/assets/[^"]+\.js' "$html" | head -1 || true)"
  if [[ -z "$asset" ]]; then
    echo "  FAIL ${label}: HTML sem /assets/*.js"
    fail=1
    rm -f "$html" "$js"
    return
  fi
  ctype="$(curl -sS --max-time 15 -o "$js" -w '%{content_type}' "http://127.0.0.1:${port}${asset}" || true)"
  if echo "$ctype" | grep -qi html || head -c 32 "$js" | grep -qiE '<!DOCTYPE|<html'; then
    echo "  FAIL ${label}: JS é HTML (${asset} ctype=${ctype}) — rebuild www/web / try_files"
    fail=1
  elif grep -qE 'localhost:517[89]|localhost:3003' "$js" 2>/dev/null; then
    echo "  FAIL ${label}: bundle contém localhost (rebuild com --env-file .env.prod / PUBLIC_*)"
    fail=1
  else
    echo "  ${label} assets OK (${asset})"
  fi
  rm -f "$html" "$js"
}
check_assets "$PORTAL_PORT" "portal"
check_assets "$GESTOR_PORT" "gestor"

if [[ "$fail" != "0" ]]; then
  err "Smoke test falhou. Diagnóstico: bash scripts/prod-blank-diag.sh"
  err "Containers: docker compose -f docker-compose.prod.yml --env-file .env.prod ps"
  exit 1
fi

log "Layout publicado: ${NEW_SHA}"
echo "  Tipografia bakeada: EXTRA=${VITE_FONT_EXTRA_GRANDE:-default} GRANDE=${VITE_FONT_GRANDE:-default} MEDIA=${VITE_FONT_MEDIA:-default}"
echo "  API/DB não foram alterados. Hard refresh no browser: Ctrl+Shift+R"
echo "  Deploy completo: bash publish.sh"
