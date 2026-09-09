#!/usr/bin/env bash
# Legacy wrapper — use scripts/prod-db-prepare.sh
set -euo pipefail
cd "$(dirname "$0")/.."
exec bash scripts/prod-db-prepare.sh
