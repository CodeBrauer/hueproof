#!/usr/bin/env bash
# Builds the static site and copies it to the web server over SSH.
# The target comes from DEPLOY_HOST and DEPLOY_PATH, set in the environment or in .env.local (see .env.example).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

SITE_URL="${SITE_URL:-https://tools.codebrauer.com/hueproof}"
: "${DEPLOY_HOST:?Set DEPLOY_HOST (user@host) in .env.local or the environment}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (target directory on the host) in .env.local or the environment}"

pnpm lint
pnpm typecheck
pnpm test
rm -rf out
NEXT_PUBLIC_SITE_URL="$SITE_URL" pnpm build

# Explicit modes, so the files never end up group-writable, whatever the server's umask.
rsync -rlvz --delete --chmod=D755,F644 out/ "$DEPLOY_HOST:$DEPLOY_PATH"

curl -fsS -o /dev/null -w "%{http_code} $SITE_URL/\n" "$SITE_URL/"
curl -fsS -o /dev/null -w "%{http_code} $SITE_URL/de/\n" "$SITE_URL/de/"
