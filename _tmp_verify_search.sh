#!/usr/bin/env bash
set -euo pipefail
cd /app/netsys-apps/cac

echo "=== REBUILD api www ==="
docker compose build api www
docker compose up -d --no-deps --force-recreate api www

echo "=== WAIT for API ==="
for i in $(seq 1 30); do
  if curl -sf -o /dev/null -w "%{http_code}" http://localhost:3003/api/health 2>/dev/null | grep -qE '200|404'; then
    break
  fi
  # health may not exist; try search readiness via docker
  if docker compose ps api 2>/dev/null | grep -q 'Up'; then
    sleep 2
    break
  fi
  sleep 1
done
sleep 3

echo "=== POST page 1 ==="
RESP1=$(curl -sS -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:3003/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"","filters":{},"page":1,"limit":10,"lang":"pt"}')

echo "$RESP1" | tee /tmp/search_p1.json
STATUS1=$(echo "$RESP1" | sed -n 's/.*HTTP_STATUS://p')
BODY1=$(echo "$RESP1" | sed '/HTTP_STATUS:/d')

python3 - <<'PY' "$BODY1" "$STATUS1"
import json, sys
body = sys.argv[1]
status = sys.argv[2]
print(f"curl_status={status}")
try:
    data = json.loads(body)
except Exception as e:
    print(f"parse_error={e}")
    sys.exit(1)
meta = data.get("meta") or {}
results = data.get("results") or data.get("data") or []
if isinstance(results, dict):
    results = results.get("items") or results.get("results") or []
print(f"mode={meta.get('mode')}")
print(f"total={meta.get('total')}")
print(f"page={meta.get('page')}")
print(f"pageSize={meta.get('pageSize')}")
print(f"totalPages={meta.get('totalPages')}")
print(f"results_count={len(results)}")
scores = [r.get("score") for r in results if isinstance(r, dict)]
print(f"scores={scores[:5]}")
first = results[0] if results else None
if first:
    title = first.get("title") or first.get("name") or first.get("titulo")
    print(f"first_title={title}")
print(f"has_ranking={any((s or 0) != 0 for s in scores)}")

total_pages = meta.get("totalPages") or 1
if total_pages and int(total_pages) > 1:
    print("=== POST page 2 ===")
    import urllib.request
    req = urllib.request.Request(
        "http://localhost:3003/api/search",
        data=json.dumps({"query":"","filters":{},"page":2,"limit":10,"lang":"pt"}).encode(),
        headers={"Content-Type":"application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data2 = json.loads(resp.read().decode())
        meta2 = data2.get("meta") or {}
        results2 = data2.get("results") or []
        print(f"page2_status={resp.status}")
        print(f"page2_mode={meta2.get('mode')}")
        print(f"page2_page={meta2.get('page')}")
        print(f"page2_results_count={len(results2)}")
else:
    print("page2_skipped=true")
PY

echo "=== DONE ==="
docker compose ps api www
