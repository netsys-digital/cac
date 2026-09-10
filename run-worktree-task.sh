#!/usr/bin/env bash
# Master runner: worktree + setup + build + prisma + tests
set -uo pipefail
REPORT="/app/netsys-apps/cac/.worktree-run-report.txt"
exec > >(tee "$REPORT") 2>&1

echo "===== START $(date -Iseconds) ====="

source /home/netsys/.nvm/nvm.sh 2>/dev/null || source ~/.nvm/nvm.sh
export PATH="$(dirname $(command -v node)):${HOME}/.local/share/pnpm:/usr/bin:/bin:$PATH"
echo "node=$(command -v node) $(node -v 2>/dev/null || true)"
echo "pnpm=$(command -v pnpm) $(pnpm -v 2>/dev/null || true)"

# --- WORKTREE CREATE ---
echo "===== WORKTREE CREATE ====="
WORKTREE_ID="vitest-conn-$(openssl rand -hex 4)"
cd /app/netsys-apps/cac
REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_BASENAME="$(basename "$REPO_ROOT")"
if command -v shasum >/dev/null 2>&1; then
  REPO_HASH="$(printf '%s' "$REPO_ROOT" | shasum -a 256 | cut -c1-12)"
else
  REPO_HASH="$(printf '%s' "$REPO_ROOT" | sha256sum | cut -c1-12)"
fi
REPO_KEY="${REPO_BASENAME}-${REPO_HASH}"
WORKTREE_SET_DIR="$HOME/.cursor/worktrees/$WORKTREE_ID"
WORKTREE_DIR="$WORKTREE_SET_DIR/$REPO_KEY"
mkdir -p "$WORKTREE_SET_DIR"
if [ -d "$WORKTREE_DIR" ]; then echo "ERROR: worktree directory already exists: $WORKTREE_DIR"; exit 1; fi
WORKTREE_START_REF="${WORKTREE_START_REF:-HEAD}"
git worktree add --detach "$WORKTREE_DIR" "$WORKTREE_START_REF"
HEAD_COMMIT="$(git -C "$WORKTREE_DIR" rev-parse HEAD)"
echo "WORKTREE_ID=$WORKTREE_ID"
echo "REPO_KEY=$REPO_KEY"
echo "WORKTREE_PATH=$WORKTREE_DIR"
echo "REPO_ROOT=$REPO_ROOT"
echo "HEAD_COMMIT=$HEAD_COMMIT"
echo "WORKTREE_START_REF=$WORKTREE_START_REF"

# --- SETUP ---
echo "===== WORKTREE SETUP ====="
SETUP_RAN=skipped
CFG=""
if [ -f "$WORKTREE_DIR/.cursor/worktrees.json" ]; then
  CFG="$WORKTREE_DIR/.cursor/worktrees.json"
elif [ -f "$REPO_ROOT/.cursor/worktrees.json" ]; then
  CFG="$REPO_ROOT/.cursor/worktrees.json"
fi
if [ -n "$CFG" ]; then
  echo "Found config: $CFG"
  cat "$CFG"
  # Prefer setup-worktree-unix, else setup-worktree — run via node/jq if available
  export ROOT_WORKTREE_PATH="$REPO_ROOT"
  cd "$WORKTREE_DIR"
  if command -v node >/dev/null 2>&1; then
    SETUP_CMDS=$(node -e '
      const fs=require("fs");
      const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
      const v=j["setup-worktree-unix"]??j["setup-worktree"];
      if(v==null){process.exit(2)}
      if(typeof v==="string"){console.log(v)}
      else if(Array.isArray(v)){v.forEach(c=>console.log(c))}
      else {process.exit(3)}
    ' "$CFG") && {
      while IFS= read -r cmd; do
        [ -z "$cmd" ] && continue
        echo "RUN SETUP: $cmd"
        bash -lc "$cmd" || { echo "SETUP_FAILED"; exit 1; }
      done <<< "$SETUP_CMDS"
      SETUP_RAN=ran
    } || {
      echo "No applicable setup keys (or parse skip)"
      SETUP_RAN=skipped
    }
  else
    echo "node missing for setup parse; SETUP skipped"
    SETUP_RAN=skipped
  fi
else
  echo "No .cursor/worktrees.json in REPO_ROOT or WORKTREE_PATH"
  SETUP_RAN=skipped
fi
echo "SETUP_STATUS=$SETUP_RAN"

cd "$WORKTREE_DIR"

# --- STEP 1 ---
echo "===== STEP 1: pnpm --filter @cac/shared build ====="
set +e
pnpm --filter @cac/shared build
STEP1_EC=$?
set -e
echo "STEP1_EXIT=$STEP1_EC"
echo "===== declineConnectionBodySchema check ====="
if grep -R "declineConnectionBodySchema" packages/shared/dist 2>/dev/null; then
  echo "DECLINE_SCHEMA=FOUND"
else
  echo "MISSING_EXPORT"
  echo "DECLINE_SCHEMA=MISSING"
fi

# --- STEP 2 ---
echo "===== STEP 2: prisma generate + migrate deploy ====="
cd "$WORKTREE_DIR/apps/api"
set +e
npx prisma generate
GEN_EC=$?
npx prisma migrate deploy
MIG_EC=$?
set -e
echo "PRISMA_GENERATE_EXIT=$GEN_EC"
echo "PRISMA_MIGRATE_EXIT=$MIG_EC"
STEP2_EC=0
[ "$GEN_EC" -eq 0 ] && [ "$MIG_EC" -eq 0 ] || STEP2_EC=1
echo "STEP2_EXIT=$STEP2_EC"

# --- STEP 3 ---
echo "===== STEP 3: vitest connections.test.ts ====="
cd "$WORKTREE_DIR/apps/api"
set +e
pnpm exec vitest run src/__tests__/connections.test.ts
STEP3_EC=$?
set -e
echo "STEP3_EXIT=$STEP3_EC"

echo "===== SUMMARY ====="
echo "WORKTREE_ID=$WORKTREE_ID"
echo "WORKTREE_PATH=$WORKTREE_DIR"
echo "REPO_ROOT=$REPO_ROOT"
echo "HEAD_COMMIT=$HEAD_COMMIT"
echo "WORKTREE_START_REF=$WORKTREE_START_REF"
echo "SETUP_STATUS=$SETUP_RAN"
echo "STEP1_EXIT=$STEP1_EC"
echo "STEP2_EXIT=$STEP2_EC"
echo "STEP3_EXIT=$STEP3_EC"
echo "===== END $(date -Iseconds) ====="
