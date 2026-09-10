#!/usr/bin/env bash
# Entrypoint da API em produção: migrate sem deixar P3009 eterno.
# Se migrate falhar, imprime diagnóstico e sai (restart policy tenta de novo
# depois que prod-db-prepare.sh no deploy corrigir ownership).
#
# Com args (ex.: compose run --rm api npx prisma …) executa só o comando
# sem subir o servidor — usado por prod-db-prepare / recover.
set -euo pipefail
cd /app/apps/api

if [[ $# -gt 0 ]]; then
  exec "$@"
fi

echo "[cac-api] prisma migrate deploy…"
if ! npx prisma migrate deploy; then
  echo "[cac-api] migrate deploy FAILED"
  echo "[cac-api] Em Postgres compartilhado NETSYS, rode no host:"
  echo "[cac-api]   bash scripts/prod-db-prepare.sh"
  echo "[cac-api] Isso aplica DDL como netsys, transfere OWNER para cac e resolve P3009."
  exit 1
fi

echo "[cac-api] seed (non-blocking)…"
npx prisma db seed || echo "[cac-api] seed failed — continuing"

echo "[cac-api] starting…"
exec node dist/index.js
