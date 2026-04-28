#!/usr/bin/env bash
# Build the site in Docker, then push the resulting dist/ to the
# `gh-pages` branch of the GitHub repo. No CI runner needed.
#
# Pages source must be set to "Deploy from a branch" → gh-pages → /(root).
#   gh repo edit NimiqToolbox/skillsetc --enable-pages
#   (or do it from https://github.com/NimiqToolbox/skillsetc/settings/pages)

set -euo pipefail

# ────────────── config ──────────────
OWNER="${OWNER:-NimiqToolbox}"
REPO="${REPO:-skillsetc}"
BRANCH="${BRANCH:-gh-pages}"

# Lowercase the owner for the github.io URL.
OWNER_LOWER=$(printf '%s' "$OWNER" | tr '[:upper:]' '[:lower:]')
SITE_URL="${SITE_URL:-https://${OWNER_LOWER}.github.io}"
BASE_PATH="${BASE_PATH:-/${REPO}}"

ROOT="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$ROOT/site"
IMAGE="skillsetc-site:export"

# ────────────── checks ──────────────
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ docker not found in PATH" >&2; exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "✗ git not found in PATH" >&2; exit 1
fi
if [[ ! -d "$SITE_DIR" ]]; then
  echo "✗ site/ directory not found at $SITE_DIR" >&2; exit 1
fi

REMOTE_URL=$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)
if [[ -z "$REMOTE_URL" ]]; then
  echo "✗ No 'origin' remote configured. Run:" >&2
  echo "    git remote add origin https://github.com/${OWNER}/${REPO}.git" >&2
  exit 1
fi

# ────────────── build (in Docker) ──────────────
echo "▶ building static site in Docker"
echo "    SITE_URL=$SITE_URL"
echo "    BASE_PATH=$BASE_PATH"
docker build \
  --target build \
  --build-arg "SITE_URL=$SITE_URL" \
  --build-arg "BASE_PATH=$BASE_PATH" \
  -t "$IMAGE" \
  -f "$SITE_DIR/Dockerfile" \
  "$SITE_DIR"

# ────────────── extract dist via docker cp ──────────────
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

CID=$(docker create "$IMAGE")
echo "▶ copying dist/ out of container $CID"
docker cp "$CID:/app/dist/." "$TMP/"
docker rm -f "$CID" >/dev/null

# Pages: tell GitHub not to run Jekyll (so /_astro/* assets are served)
touch "$TMP/.nojekyll"

# ────────────── push to gh-pages ──────────────
cd "$TMP"
git init -q -b "$BRANCH"
git remote add origin "$REMOTE_URL"
# Identity (only used inside this throw-away worktree)
git config user.name "${GIT_USER_NAME:-skillsetc deploy}"
git config user.email "${GIT_USER_EMAIL:-deploy@skillsetc.local}"

git add -A
git -c commit.gpgsign=false commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "▶ force-pushing to $BRANCH on origin"
git push -f -u origin "$BRANCH"

cd "$ROOT"

echo
echo "✓ Deployed."
echo "   Live URL (after Pages picks it up): ${SITE_URL}${BASE_PATH}/"
echo "   First time only: set Pages source to '$BRANCH' branch / (root) at"
echo "   https://github.com/${OWNER}/${REPO}/settings/pages"
