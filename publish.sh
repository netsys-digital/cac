#!/usr/bin/env bash
# ============================================================================
# CAC — publicação em produção (SIMPLES, um comando só)
#
# Fluxo pretendido:
#   1. dev local: git add / commit / push
#   2. servidor:  cd /app/cac && bash publish.sh
#
# O que este script faz, sempre:
#   * trava (evita 2 deploys simultâneos)
#   * confere .env.prod + chaves críticas (DB, URLs, tipografia)
#   * git fetch + reset --hard origin/main (limpo, sem conflito)
#   * garante infra compartilhada netsys (postgres/redis)
#   * prepara schema no Postgres compartilhado (owner cac + DDL idempotente)
#   * build --no-cache de todas as imagens (api, api-worker, web, www)
#   * up -d --force-recreate  → entrypoint da API roda `prisma migrate deploy`
#   * espera API healthy
#   * recria gateway (nginx) — evita IP cache
#   * smoke test (health + assets JS reais, sem localhost)
#
# Se algo falhar, PARA imediatamente e imprime o motivo.
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

# Carrega .env.prod (valores com espaço devem estar entre aspas no arquivo)
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

log "Confere .env.prod"
require_var CAC_DB_PASSWORD
require_var JWT_SECRET
require_var JWT_REFRESH_SECRET
require_var PUBLIC_WWW_URL
require_var PUBLIC_WEB_URL
require_var CORS_ORIGIN
require_var COOKIE_DOMAIN

# Tipografia bakeada no build Vite — se faltar, o compose usa defaults antigos
for k in VITE_FONT_EXTRA_GRANDE VITE_FONT_GRANDE VITE_FONT_MEDIA VITE_FONT_PEQUENA VITE_FONT_MINI; do
  if [[ -z "${!k:-}" ]]; then
    warn "${k} ausente em .env.prod — build usará default do compose (pode divergir do local)."
  fi
done

# Avisa chaves novas do example que ainda não estão no .env.prod (não altera o arquivo)
if [[ -f .env.prod.example ]]; then
  missing=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    key="${line%%=*}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ -z "$key" ]] && continue
    if ! grep -qE "^[[:space:]]*${key}=" .env.prod; then
      missing+=("$key")
    fi
  done < .env.prod.example
  if ((${#missing[@]})); then
    warn "Chaves em .env.prod.example ausentes em .env.prod:"
    printf '    %s\n' "${missing[@]}" >&2
    warn "Copie do example (sem sobrescrever secrets) se precisar dos novos defaults."
  fi
fi

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

# Re-source após git (.env.prod permanece gitignored)
set -a
# shellcheck disable=SC1091
source ./.env.prod
set +a
PORTAL_PORT="${GATEWAY_PORT_PORTAL:-8084}"
GESTOR_PORT="${GATEWAY_PORT_GESTOR:-8086}"

# ----- 2) infra netsys -------------------------------------------------------
resolve_docker_config() {
  local d
  for d in "${DOCKER_CONFIG_DIR:-}" "$(pwd)/../docker-config" /app/docker-config /app/netsys-apps/docker-config; do
    [[ -z "$d" ]] && continue
    if [[ -f "$d/docker-compose.yml" && -f "$d/.env" ]]; then
      echo "$(cd "$d" && pwd)"
      return 0
    fi
  done
  return 1
}
DOCKER_CFG="$(resolve_docker_config || true)"

if [[ -n "$DOCKER_CFG" ]]; then
  log "Garante infra compartilhada em ${DOCKER_CFG}"
  (cd "$DOCKER_CFG" && docker compose --env-file .env up -d postgres redis)
  for i in $(seq 1 30); do
    if docker exec netsys-postgres pg_isready -U netsys >/dev/null 2>&1 \
      && docker exec netsys-redis redis-cli ping 2>/dev/null | grep -q PONG; then
      echo "  netsys-postgres + netsys-redis OK"
      break
    fi
    sleep 2
    [[ "$i" == "30" ]] && { err "Timeout esperando netsys-postgres/redis"; exit 1; }
  done
else
  echo "  (docker-config não encontrado — assumindo Postgres/Redis externos já no ar)"
fi

# ----- 3) prepara schema (owner + DDL idempotente) ---------------------------
log "Prepara schema Postgres (owner cac + DDL idempotente)"
chmod +x scripts/prod-db-prepare.sh
bash scripts/prod-db-prepare.sh

# ----- 4) build de todas as imagens (sem cache nos fronts) -------------------
log "Build imagens (api, api-worker, web, www) — fronts --no-cache (PUBLIC_* + VITE_FONT_*)"
"${COMPOSE[@]}" build api api-worker
"${COMPOSE[@]}" build --no-cache web www

# ----- 5) recreate ordenado --------------------------------------------------
log "Baixa modelos Argos no host (fora do Docker) e constrói LibreTranslate"
bash deploy/libretranslate/fetch-models.sh
"${COMPOSE[@]}" build libretranslate
"${COMPOSE[@]}" up -d --no-deps --force-recreate libretranslate

log "Recreate API (entrypoint aplica prisma migrate deploy)"
"${COMPOSE[@]}" up -d --no-deps --force-recreate api

log "Aguarda API healthy"
ok=0
for i in $(seq 1 60); do
  if "${COMPOSE[@]}" ps api 2>/dev/null | grep -qE 'healthy'; then
    echo "  api → healthy"
    ok=1
    break
  fi
  if curl -sf "http://127.0.0.1:${PORTAL_PORT}/health" >/dev/null 2>&1; then
    echo "  api → HTTP /health OK"
    ok=1
    break
  fi
  sleep 3
done
if [[ "$ok" != "1" ]]; then
  err "API não ficou healthy. Últimas linhas do log:"
  "${COMPOSE[@]}" logs --tail 60 api || true
  exit 1
fi

log "Recreate api-worker, www, web"
"${COMPOSE[@]}" up -d --no-deps --force-recreate api-worker www web

log "Recreate gateway (nginx)"
"${COMPOSE[@]}" up -d --no-deps --force-recreate gateway

docker image prune -f >/dev/null

# ----- 6) smoke test ---------------------------------------------------------
log "Smoke test"
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
check "http://127.0.0.1:${PORTAL_PORT}/health" "api-health"
check "http://127.0.0.1:${PORTAL_PORT}/"       "portal"
check "http://127.0.0.1:${GESTOR_PORT}/"       "gestor"

# Assets: evita página em branco (JS=HTML) e bake errado (localhost no bundle)
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

log "Publicação concluída: ${NEW_SHA}"
echo "  Tipografia bakeada: EXTRA=${VITE_FONT_EXTRA_GRANDE:-default} GRANDE=${VITE_FONT_GRANDE:-default} MEDIA=${VITE_FONT_MEDIA:-default}"
echo "  Se o browser mostrar layout antigo → hard refresh (Ctrl+Shift+R)."
