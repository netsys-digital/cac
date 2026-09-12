#!/usr/bin/env bash
set -u
cd /app/netsys-apps/cac || exit 1
source ~/.nvm/nvm.sh 2>/dev/null || true

OUT=/app/netsys-apps/cac/tmp-typecheck-report.txt
: > "$OUT"

run_step() {
  local label="$1"
  shift
  {
    echo "========== $label =========="
    echo "CMD: $*"
    echo "----------"
  } >> "$OUT"
  set +e
  "$@" >> "$OUT" 2>&1
  local ec=$?
  set -e
  {
    echo "----------"
    echo "EXIT_CODE: $ec"
    echo ""
  } >> "$OUT"
  return 0
}

run_step "shared build" npm run build -w @cac/shared
run_step "api build (tsc)" npm run build -w @cac/api
run_step "web tsc -b" bash -lc 'cd /app/netsys-apps/cac/apps/web && npx tsc -b --pretty false'
run_step "www tsc -b" bash -lc 'cd /app/netsys-apps/cac/apps/www && npx tsc -b --pretty false'

{
  echo "========== MATCHING ERRORS =========="
  grep -nE 'bannerLinkUrl|BannerImageField|resolveDetailBanner|ORG_BANNER_LINK_FIELD' "$OUT" || echo "(none matched)"
} >> "$OUT"

echo DONE >> "$OUT"
exit 0
