#!/bin/bash
# Local dev — download PocketBase + start it
# Run from project root: bash deploy/dev-start.sh

set -e

PB_VERSION="0.22.14"
PB_DIR="./.pocketbase"

# Detect OS/arch
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
esac

mkdir -p "$PB_DIR"
cd "$PB_DIR"

if [ ! -f pocketbase ]; then
  echo "━━━ Downloading PocketBase v${PB_VERSION} for ${OS}/${ARCH} ━━━"
  URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
  curl -sSL "$URL" -o pb.zip
  unzip -q pb.zip
  rm pb.zip CHANGELOG.md LICENSE.md 2>/dev/null || true
  chmod +x pocketbase
  echo "✓ Downloaded"
fi

echo ""
echo "━━━ Starting PocketBase on http://127.0.0.1:8090 ━━━"
echo "Admin UI: http://127.0.0.1:8090/_/"
echo ""
echo "First run: you'll be prompted to create an admin account in the UI"
echo "Then run: bash deploy/init-pocketbase.sh http://127.0.0.1:8090 YOUR_ADMIN_EMAIL YOUR_PASSWORD"
echo ""
echo "Press Ctrl+C to stop."
echo ""

exec ./pocketbase serve --http=127.0.0.1:8090
