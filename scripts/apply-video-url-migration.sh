#!/usr/bin/env bash
# Aplica coluna Technology.videoUrl no Postgres local (dev).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> prisma migrate deploy"
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "==> prisma generate"
npx prisma generate --schema apps/api/prisma/schema.prisma

echo "==> build @cac/shared"
npm run build -w @cac/shared

echo "OK — reinicie a API se estiver rodando (tsx watch costuma recarregar sozinho)."
