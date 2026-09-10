#!/usr/bin/env bash
# Cole no WSL: bash /app/netsys-apps/cac/scripts/_run_requested_steps.sh
set -uo pipefail
cd /app/netsys-apps/cac
LOG=/app/netsys-apps/cac/scripts/_run_requested_steps.log
exec > >(tee "$LOG") 2>&1

source /home/netsys/.nvm/nvm.sh 2>/dev/null || source ~/.nvm/nvm.sh 2>/dev/null || true
export PATH="$(dirname "$(command -v node 2>/dev/null || true)"):${HOME}/.local/share/pnpm:/usr/bin:/bin:${PATH}"
hash -r

echo "=== ENV ==="
echo "node=$(command -v node) $(node -v 2>&1)"
echo "pnpm=$(command -v pnpm) $(pnpm -v 2>&1)"

echo ""
echo "=== STEP 1: pnpm --filter @cac/shared build ==="
pnpm --filter @cac/shared build
S1=$?
echo "EXIT_STEP1=$S1"

echo ""
echo "=== CHECK declineConnectionBodySchema in dist ==="
if [ -d packages/shared/dist ]; then
  grep -R "declineConnectionBodySchema" packages/shared/dist && echo "EXPORT_PRESENT=yes" || echo "EXPORT_PRESENT=MISSING"
else
  echo "EXPORT_PRESENT=MISSING (packages/shared/dist does not exist)"
fi

echo ""
echo "=== STEP 2: prisma generate + migrate deploy ==="
(
  cd apps/api && npx prisma generate && npx prisma migrate deploy
)
S2=$?
echo "EXIT_STEP2=$S2"

echo ""
echo "=== STEP 3: vitest connections.test.ts ==="
(
  cd apps/api && pnpm exec vitest run src/__tests__/connections.test.ts
)
S3=$?
echo "EXIT_STEP3=$S3"

echo ""
echo "=== SUMMARY ==="
echo "step1=$S1 step2=$S2 step3=$S3"
echo "log=$LOG"
