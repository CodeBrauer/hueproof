#!/usr/bin/env bash
# Builds the static site and copies it to the web server.
# Defaults: https://tools.codebrauer.com/hueproof, served by a web server from
# /var/www/example.com/hueproof. Override with SITE_URL, DEPLOY_HOST and DEPLOY_PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${SITE_URL:-https://tools.codebrauer.com/hueproof}"
DEPLOY_HOST="${DEPLOY_HOST:-user@example.com}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/example.com/hueproof/}"

pnpm lint
pnpm typecheck
pnpm test
rm -rf out
NEXT_PUBLIC_SITE_URL="$SITE_URL" pnpm build

# Explicit modes: whatever the server's umask, files must not end up group-writable.
rsync -rlvz --delete --chmod=D755,F644 out/ "$DEPLOY_HOST:$DEPLOY_PATH"

curl -fsS -o /dev/null -w "%{http_code} $SITE_URL/\n" "$SITE_URL/"
curl -fsS -o /dev/null -w "%{http_code} $SITE_URL/de/\n" "$SITE_URL/de/"
