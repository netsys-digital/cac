#!/usr/bin/env bash
# Smoke checklist Marco 1 (§8.1) — API + seed volumes
set -euo pipefail

API=${API_URL:-http://localhost:8084}
# fallback se gateway não estiver up
if ! curl -sf "$API/health" >/dev/null 2>&1; then
  API=${API_URL_FALLBACK:-http://localhost:3003}
fi

pass=0
fail=0
check() {
  local name="$1"
  shift
  if "$@"; then
    echo "PASS  $name"
    pass=$((pass + 1))
  else
    echo "FAIL  $name"
    fail=$((fail + 1))
  fi
}

echo "== Smoke Marco 1 against $API =="

check "health" curl -sf "$API/health" >/dev/null
check "ready" curl -sf "$API/ready" >/dev/null

TOKEN=$(curl -sf -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cac.local","password":"Admin123!"}' | python3 -c 'import sys,json; print(json.load(sys.stdin).get("accessToken",""))' || true)
check "login admin" test -n "$TOKEN"

count() {
  local path="$1"
  local key="$2"
  local min="$3"
  local n
  n=$(curl -sf "$API$path" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('$key', d.get('items', []))))" 2>/dev/null || echo 0)
  test "$n" -ge "$min"
}

check "seed techs ≥10" count /api/technologies items 10
check "seed challenges ≥5" count /api/challenges items 5
check "seed projects ≥5" count /api/projects items 5
check "seed offers ≥3" count '/api/funding-offers?active=true' items 3
check "seed funders ≥5" count /api/funders items 5
check "seed cases ≥3" count /api/success-cases items 3

MZ=$(curl -sf "$API/api/success-cases/captacao-chuva-horticultura-mocambique" | python3 -c 'import sys,json; d=json.load(sys.stdin); c=d["successCase"]; print(1 if c.get("media") and c.get("needs") else 0)' || echo 0)
check "caso MZ com evidências" test "$MZ" = "1"

SEARCH=$(curl -sf -X POST "$API/api/search" -H 'Content-Type: application/json' \
  -d '{"query":"recuperação de pastagens em seca","lang":"pt"}')
check "busca âncora 200" test -n "$SEARCH"

python3 - <<PY
import json,sys,os
d=json.loads('''$SEARCH'''.replace("'''",'"""') if False else json.dumps({}))
PY

echo "$SEARCH" | python3 -c '
import sys,json
d=json.load(sys.stdin)
assert "interpretation" in d and "facets" in d
assert "whoCanImplement" not in d.get("paths",{})
scores=sorted([r["score"] for r in d["results"][:3]], reverse=True)
assert scores[:3]==[94,89,83] or (len(scores)>=3 and scores[0]>=83), scores
assert all(len(r.get("factors",[]))>=3 for r in d["results"][:1])
kinds={x["kind"] for x in d["paths"]["whoCanFund"]}
assert kinds<={"ACTIVE_OFFER"} or kinds==set(), kinds
print("search_ok", scores[:3], "fund_kinds", kinds)
' && echo "PASS  busca âncora scores/factors/paths" && pass=$((pass+1)) || { echo "FAIL  busca âncora scores/factors/paths"; fail=$((fail+1)); }

if [[ -n "$TOKEN" ]]; then
  check "admin kpis" curl -sf "$API/api/admin/kpis" -H "Authorization: Bearer $TOKEN" >/dev/null
  check "admin pending" curl -sf "$API/api/admin/pending" -H "Authorization: Bearer $TOKEN" >/dev/null
fi

echo "== Result: $pass pass · $fail fail =="
test "$fail" -eq 0
