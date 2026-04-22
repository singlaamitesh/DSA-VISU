#!/bin/bash
# Initialize PocketBase collections for Algorhythm
# Creates the `generations` collection with proper fields + API rules
#
# Usage:
#   ./init-pocketbase.sh http://127.0.0.1:8090 admin@example.com AdminPassword

set -e

PB_URL="${1:-http://127.0.0.1:8090}"
ADMIN_EMAIL="${2}"
ADMIN_PASSWORD="${3}"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "Usage: $0 <pocketbase-url> <admin-email> <admin-password>"
  echo "Example: $0 http://127.0.0.1:8090 admin@example.com MyPassword123"
  exit 1
fi

echo "━━━ Authenticating as admin ━━━"
ADMIN_TOKEN=$(curl -sS -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "✗ Failed to authenticate as admin"
  exit 1
fi

echo "✓ Authenticated"

echo "━━━ Creating 'generations' collection ━━━"

# Check if collection already exists
EXISTS=$(curl -sS "$PB_URL/api/collections/generations" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o /dev/null -w "%{http_code}")

if [ "$EXISTS" = "200" ]; then
  echo "✓ Collection 'generations' already exists — skipping"
  exit 0
fi

# Create collection
curl -sS -X POST "$PB_URL/api/collections" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "generations",
    "type": "base",
    "schema": [
      {
        "name": "user",
        "type": "relation",
        "required": true,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "maxSelect": 1
        }
      },
      {
        "name": "prompt",
        "type": "text",
        "required": true,
        "options": { "max": 2000 }
      },
      {
        "name": "html",
        "type": "text",
        "required": true,
        "options": { "max": 1000000 }
      },
      {
        "name": "language",
        "type": "text",
        "required": false,
        "options": { "max": 32 }
      }
    ],
    "listRule": "user = @request.auth.id",
    "viewRule": "user = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id",
    "indexes": [
      "CREATE INDEX idx_generations_user_created ON generations (user, created DESC)"
    ]
  }' | grep -o '"id":"[^"]*' | head -1

echo ""
echo "✓ Collection 'generations' created successfully"
echo ""
echo "Fields:"
echo "  - user (relation → users, cascade delete)"
echo "  - prompt (text, max 2000)"
echo "  - html (text, max 1M)"
echo "  - language (text, optional)"
echo ""
echo "Rules: users can only access their own generations"
