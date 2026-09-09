#!/usr/bin/env bash
# Instalação do zero do CAC em produção (servidor NETSYS).
#
# Pré-requisitos no host:
#   - Docker + compose plugin
#   - Rede docker "netsys" e stack /app/docker-config (postgres + redis)
#   - Clone do repo em /app/cac (path canônico de produção)
#
# Uso (como root, no servidor):
#   cd /app/cac
#   cp .env.prod.example .env.prod   # se ainda não existir — edite secrets
#   bash scripts/install-prod.sh              # sobe stack (mantém DB se já existir)
#   bash scripts/install-prod.sh --wipe-db    # APAGA schema public do banco cac e reinstala
#
# Depois: anexe deploy/nginx/netsys-apps-cac.conf.snippet ao nginx do host + certbot.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WIPE_DB=0
[[ "${1:-}" == "--wipe-db" ]] && WIPE_DB=1

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
PG_CONTAINER="${PG_CONTAINER:-netsys-postgres}"
PG_SUPERUSER="${PG_SUPERUSER:-netsys}"
APP_DB="${APP_DB:-cac}"
APP_USER="${APP_USER:-cac}"

resolve_docker_config() {
  local candidates=(
    "${DOCKER_CONFIG_DIR:-}"
    "$ROOT/../docker-config"
    /app/docker-config
    /app/netsys-apps/docker-config
  )
  local d
  for d in "${candidates[@]}"; do
    [[ -z "$d" ]] && continue
    if [[ -f "$d/docker-compose.yml" && -f "$d/.env" ]]; then
      echo "$(cd "$d" && pwd)"
      return 0
    fi
  done
  return 1
}

echo "== CAC install-prod =="
echo "PWD=$ROOT"

if [[ ! -f .env.prod ]]; then
  echo "Falta .env.prod — rode: cp .env.prod.example .env.prod && edite CAC_DB_PASSWORD / JWT_*"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env.prod
set +a

if [[ -z "${CAC_DB_PASSWORD:-}" ]]; then
  echo "CAC_DB_PASSWORD vazio em .env.prod (obrigatório para a API)."
  exit 1
fi

if [[ "${#JWT_SECRET}" -lt 32 || "${#JWT_REFRESH_SECRET}" -lt 32 ]]; then
  echo "JWT_SECRET e JWT_REFRESH_SECRET devem ter ≥ 32 caracteres."
  exit 1
fi

DOCKER_CONFIG_DIR="$(resolve_docker_config)" || {
  echo "docker-config não encontrado (esperado /app/docker-config ou ../docker-config)."
  exit 1
}
echo "docker-config: $DOCKER_CONFIG_DIR"

echo "==> Rede netsys"
if ! docker network inspect netsys >/dev/null 2>&1; then
  echo "Criando rede docker netsys…"
  docker network create netsys
fi

echo "==> Infra compartilhada (postgres + redis)"
(cd "$DOCKER_CONFIG_DIR" && docker compose --env-file .env up -d postgres redis)
for i in $(seq 1 40); do
  if docker exec "$PG_CONTAINER" pg_isready -U "$PG_SUPERUSER" >/dev/null 2>&1 \
    && docker exec netsys-redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "  postgres + redis OK"
    break
  fi
  sleep 2
  if [[ "$i" -eq 40 ]]; then
    echo "Timeout aguardando postgres/redis"
    exit 1
  fi
done

echo "==> Volume uploads"
docker volume create cac_uploads_data >/dev/null
echo "  cac_uploads_data OK"

echo "==> Role/banco PostgreSQL (${APP_USER}/${APP_DB})"
# Cria role + DB se não existirem; atualiza senha para bater com .env.prod
docker exec -i "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_USER}') THEN
    CREATE ROLE ${APP_USER} LOGIN PASSWORD '${CAC_DB_PASSWORD}';
  ELSE
    ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${CAC_DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${APP_DB} OWNER ${APP_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${APP_DB}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${APP_DB} TO ${APP_USER};
SQL

docker exec -i "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d "$APP_DB" <<SQL
GRANT ALL ON SCHEMA public TO ${APP_USER};
ALTER SCHEMA public OWNER TO ${APP_USER};
SQL

if [[ "$WIPE_DB" == "1" ]]; then
  echo "==> --wipe-db: drop schema public CASCADE"
  docker exec -i "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d "$APP_DB" <<SQL
DROP SCHEMA public CASCADE;
CREATE SCHEMA public AUTHORIZATION ${APP_USER};
GRANT ALL ON SCHEMA public TO ${APP_USER};
SQL
fi

chmod +x deploy.sh scripts/*.sh 2>/dev/null || true

echo "==> Build + up (deploy.sh --full)"
# install-prod já garante infra; deploy.sh também chama ensure_netsys_infra
bash deploy.sh --full

echo
echo "==> Checagem de assets (não pode ser text/html)"
check_js() {
  local port="$1" label="$2"
  local html js code ctype
  html="$(curl -sS --max-time 10 "http://127.0.0.1:${port}/" || true)"
  js="$(echo "$html" | grep -oE '/assets/[^"]+\.js' | head -1 || true)"
  if [[ -z "$js" ]]; then
    echo "  FAIL ${label}: sem /assets/*.js no HTML"
    return 1
  fi
  ctype="$(curl -sS -o /tmp/cac-js-check.bin -w '%{content_type}' --max-time 10 "http://127.0.0.1:${port}${js}" || true)"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:${port}${js}" || true)"
  if [[ "$code" != "200" ]] || echo "$ctype" | grep -qi html; then
    echo "  FAIL ${label}: ${js} → HTTP ${code} ctype=${ctype}"
    return 1
  fi
  if head -c 32 /tmp/cac-js-check.bin | grep -qi '<!DOCTYPE\|<html'; then
    echo "  FAIL ${label}: body HTML no JS"
    return 1
  fi
  echo "  OK ${label}: ${js} (${ctype})"
}

fail=0
check_js 8084 portal || fail=1
check_js 8086 gestor || fail=1

echo
echo "Instalação concluída."
echo "Nginx do host: anexe deploy/nginx/netsys-apps-cac.conf.snippet e rode:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo "  sudo certbot --nginx -d portalcac.netsys.company -d gestorcac.netsys.company"
echo
if [[ "$fail" == "1" ]]; then
  echo "AVISO: assets falharam — veja docker logs cac-web-1 / cac-www-1 e rode de novo: bash deploy.sh --full"
  exit 1
fi
