#!/usr/bin/env bash
# Deploy produção CAC (espelha o fluxo do escolar).
# Uso no servidor: bash deploy.sh [--full]
# GitHub Actions passa DEPLOY_SHA=<commit>.
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
FORCE_ALL=0
[[ "${1:-}" == "--full" ]] && FORCE_ALL=1

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
  "${COMPOSE[@]}" ps
  return "$fail"
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
  echo "Modo --full: rebuild de api, api-worker, web, www e gateway."
  mark_all
elif [[ "$OLD_SHA" == "$NEW_SHA" ]]; then
  echo "Servidor já está nesse commit. Sem build."
  smoke_test
  echo
  echo "Deploy concluído: ${NEW_SHA}"
  exit 0
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
fi

services=()
[[ "$need_api" == "1" ]] && services+=(api)
[[ "$need_worker" == "1" ]] && services+=(api-worker)
[[ "$need_web" == "1" ]] && services+=(web)
[[ "$need_www" == "1" ]] && services+=(www)

if [[ ${#services[@]} -eq 0 && "$need_gateway" != "1" ]]; then
  echo "Nenhuma imagem Docker para rebuild (só docs/CI/scripts)."
  smoke_test
  echo
  echo "Deploy concluído: ${NEW_SHA}"
  exit 0
fi

echo
echo "Serviços: ${services[*]:-nenhum}  gateway=${need_gateway}"

"${COMPOSE[@]}" up -d postgres redis

# Frontends precisam da API no ar; migrate/seed rodam no start da api.
if [[ "$need_api" != "1" && ( ${#services[@]} -gt 0 || "$need_gateway" == "1" ) ]]; then
  "${COMPOSE[@]}" up -d api api-worker
fi

if [[ ${#services[@]} -gt 0 ]]; then
  build_fail=0
  for svc in "${services[@]}"; do
    echo
    echo "Build ${svc}…"
    if ! "${COMPOSE[@]}" build "$svc"; then
      echo "Falha no build: ${svc}"
      build_fail=1
      continue
    fi
    "${COMPOSE[@]}" up -d --no-deps --remove-orphans "$svc"
  done
  if [[ "$build_fail" == "1" ]]; then
    echo
    echo "Deploy interrompido: um ou mais builds falharam."
    exit 1
  fi
fi

if [[ "$need_gateway" == "1" ]]; then
  echo
  echo "Recarrega gateway…"
  "${COMPOSE[@]}" up -d --no-deps --force-recreate gateway
fi

docker image prune -f >/dev/null
smoke_test

echo
echo "Deploy concluído: ${NEW_SHA}"
