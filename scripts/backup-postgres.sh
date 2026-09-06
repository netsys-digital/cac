#!/usr/bin/env bash
# Backup Postgres da stack de demo (substitui dump MySQL do doc antigo).
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR=${1:-./backups}
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/cac-$STAMP.sql.gz"

COMPOSE=${COMPOSE_FILE:-docker-compose.prod.yml}
echo "Backing up via $COMPOSE → $FILE"
docker compose -f "$COMPOSE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-cac}" "${POSTGRES_DB:-cac}" | gzip > "$FILE"
echo "OK $FILE ($(du -h "$FILE" | cut -f1))"
