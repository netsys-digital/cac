#!/usr/bin/env bash
# Deploy produção CAC (espelha o fluxo do escolar).
# Uso no servidor: bash deploy.sh [--full]
# GitHub Actions passa DEPLOY_SHA=<commit> e deve preferir --full para frontends.
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
FORCE_ALL=0
[[ "${1:-}" == "--full" ]] && FORCE_ALL=1

DOCKER_CONFIG_DIR="$(cd ../docker-config 2>/dev/null && pwd || true)"

mkdir -p /var/lock
exec 9>/var/lock/cac-deploy.lock
flock -n 9 || { echo "Deploy já em andamento"; exit 1; }

wait_http() {
  local url="$1"
  local code=""
  local i
  for i in $(seq 1 45); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
    if [[ "$code" == "200" ]]; then
      echo "  ${url} → HTTP ${code}"
      return 0
    fi
    sleep 2
  done
  echo "  ${url} → HTTP ${code:-erro} (timeout)"
  return 1
}

smoke_test() {
  echo
  echo "Checagem:"
  local fail=0
  wait_http "http://127.0.0.1:8084/health" || fail=1
  wait_http "http://127.0.0.1:8084/" || fail=1
  wait_http "http://127.0.0.1:8086/" || fail=1

  # Frontends Vite: JS não deve apontar para localhost (build sem PUBLIC_*)
  local js_web js_www
  js_www="$(curl -s http://127.0.0.1:8084/ | grep -oE '/assets/[^"]+\.js' | head -1 || true)"
  js_web="$(curl -s http://127.0.0.1:8086/ | grep -oE '/assets/[^"]+\.js' | head -1 || true)"
  if [[ -n "$js_www" ]]; then
    if curl -s "http://127.0.0.1:8084${js_www}" | grep -q 'localhost:5178'; then
      echo "  FAIL portal JS ainda contém localhost:5178 (rebuild www com --env-file .env.prod)"
      fail=1
    else
      echo "  portal assets OK (${js_www})"
    fi
  fi
  if [[ -n "$js_web" ]]; then
    if curl -s "http://127.0.0.1:8086${js_web}" | grep -q 'localhost:5178'; then
      echo "  FAIL gestor JS ainda contém localhost:5178"
      fail=1
    else
      echo "  gestor assets OK (${js_web})"
    fi
  fi

  "${COMPOSE[@]}" ps
  return "$fail"
}

build_up() {
  local svc="$1"
  local no_cache="${2:-0}"
  echo
  echo "Build ${svc} (no_cache=${no_cache})…"
  if [[ "$no_cache" == "1" ]]; then
    "${COMPOSE[@]}" build --no-cache "$svc"
  else
    "${COMPOSE[@]}" build "$svc"
  fi
  "${COMPOSE[@]}" up -d --no-deps --force-recreate --remove-orphans "$svc"
}

ensure_netsys_infra() {
  if [[ -z "${DOCKER_CONFIG_DIR}" || ! -f "${DOCKER_CONFIG_DIR}/docker-compose.yml" ]]; then
    echo "docker-config não encontrado em ../docker-config (infra compartilhada)."
    exit 1
  fi
  if [[ ! -f "${DOCKER_CONFIG_DIR}/.env" ]]; then
    echo "Falta ${DOCKER_CONFIG_DIR}/.env"
    exit 1
  fi

  echo "Garante infra compartilhada (postgres + redis)…"
  (cd "${DOCKER_CONFIG_DIR}" && docker compose --env-file .env up -d postgres redis)

  local i
  for i in $(seq 1 30); do
    if docker exec netsys-postgres pg_isready -U netsys >/dev/null 2>&1 \
      && docker exec netsys-redis redis-cli ping 2>/dev/null | grep -q PONG; then
      echo "  netsys-postgres + netsys-redis OK"
      return 0
    fi
    sleep 2
  done
  echo "Timeout aguardando netsys-postgres / netsys-redis"
  exit 1
}

if [[ ! -f .env.prod ]]; then
  echo "Falta .env.prod no servidor (copie de .env.prod.example e ajuste secrets)."
  exit 1
fi

OLD_SHA="$(git rev-parse HEAD)"
git fetch origin --prune
git reset --hard "${DEPLOY_SHA:-origin/main}"
NEW_SHA="$(git rev-parse HEAD)"

echo "Deploy ${OLD_SHA:0:7} → ${NEW_SHA:0:7}"

need_api=0
need_worker=0
need_web=0
need_www=0
need_gateway=0

mark_all() {
  need_api=1
  need_worker=1
  need_web=1
  need_www=1
  need_gateway=1
}

if [[ "$FORCE_ALL" == "1" ]]; then
  echo "Modo --full: rebuild de api, api-worker, web, www e gateway (frontends sem cache)."
  mark_all
elif [[ "$OLD_SHA" == "$NEW_SHA" ]]; then
  # Mesmo commit ≠ imagens atualizadas (ex.: git já estava no SHA e só docs/CI mudaram antes).
  echo "Mesmo commit no git — forçando rebuild de web+www (layout/UI)."
  need_web=1
  need_www=1
  need_gateway=1
else
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    case "$f" in
      package.json|package-lock.json|docker-compose.prod.yml)
        echo "  (stack)  $f"
        mark_all
        ;;
      apps/api/prisma/*)
        echo "  (api)    $f — migrate no start da api"
        need_api=1
        need_worker=1
        ;;
      apps/api/*)
        echo "  (api)    $f"
        need_api=1
        need_worker=1
        ;;
      apps/web/*)
        echo "  (web)    $f"
        need_web=1
        ;;
      apps/www/*)
        echo "  (www)    $f"
        need_www=1
        ;;
      packages/*)
        echo "  (pkgs)   $f — rebuild api+frontends"
        need_api=1
        need_worker=1
        need_web=1
        need_www=1
        ;;
      deploy/nginx/*)
        echo "  (gw)     $f"
        need_gateway=1
        ;;
      deploy.sh|.github/*|README.md|.gitignore|.cursorrules|_REQUISITOS/*|scripts/*|.env.prod.example)
        echo "  (skip)   $f"
        ;;
      *)
        echo "  (stack)  $f — arquivo compartilhado, rebuild geral"
        mark_all
        ;;
    esac
  done < <(git diff --name-only "$OLD_SHA" "$NEW_SHA")

  # Se o diff só tinha skip (ex.: só .github), ainda assim atualiza frontends
  if [[ "$need_api" != "1" && "$need_web" != "1" && "$need_www" != "1" && "$need_gateway" != "1" ]]; then
    echo "Diff só com arquivos skip — forçando rebuild web+www."
    need_web=1
    need_www=1
    need_gateway=1
  fi
fi

services=()
[[ "$need_api" == "1" ]] && services+=(api)
[[ "$need_worker" == "1" ]] && services+=(api-worker)
[[ "$need_web" == "1" ]] && services+=(web)
[[ "$need_www" == "1" ]] && services+=(www)

echo
echo "Serviços: ${services[*]:-nenhum}  gateway=${need_gateway}"

ensure_netsys_infra

if [[ "$need_api" != "1" && ( ${#services[@]} -gt 0 || "$need_gateway" == "1" ) ]]; then
  "${COMPOSE[@]}" up -d api api-worker
fi

if [[ ${#services[@]} -gt 0 ]]; then
  build_fail=0
  for svc in "${services[@]}"; do
    # web/www: sempre --no-cache (Vite embute UI/URLs no build)
    no_cache=0
    if [[ "$svc" == "web" || "$svc" == "www" || "$FORCE_ALL" == "1" ]]; then
      no_cache=1
    fi
    if ! build_up "$svc" "$no_cache"; then
      echo "Falha no build: ${svc}"
      build_fail=1
    fi
  done
  if [[ "$build_fail" == "1" ]]; then
    echo
    echo "Deploy interrompido: um ou mais builds falharam."
    exit 1
  fi
fi

# Always recreate gateway after builds: nginx caches upstream IPs;
# after web/www recreate, stale IPs can make the portal serve gestor.
echo
echo "Recarrega gateway…"
"${COMPOSE[@]}" up -d --no-deps --force-recreate gateway

docker image prune -f >/dev/null
smoke_test

echo
echo "Deploy concluído: ${NEW_SHA}"
echo "Se o browser ainda mostrar layout antigo: hard refresh (Ctrl+Shift+R) ou purge Cloudflare."
