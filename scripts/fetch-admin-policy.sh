#!/bin/bash
# fetch-admin-policy.sh — save the realm's signed admin policy for the app to hand to signing admins.
#
# Run once AFTER `tide-realm-admin` has been granted (the policy is created by that grant):
#   bash scripts/fetch-admin-policy.sh
#
# The policy bytes are signed and not secret, but reading them needs an admin token. This script
# uses the master-admin credentials from .env so those never enter the app's runtime.
# Writes data/admin-policy.json (gitignored).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a; . "$PROJECT_DIR/.env"; set +a
fi

: "${KC_BOOTSTRAP_ADMIN_PASSWORD:?KC_BOOTSTRAP_ADMIN_PASSWORD is not set (see .env.example)}"
KC_BOOTSTRAP_ADMIN_USERNAME="${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}"
TIDECLOAK_URL="${TIDECLOAK_URL:-http://localhost:8080}"
REALM_NAME="${REALM_NAME:-$(jq -r '.realm' "$PROJECT_DIR/data/tidecloak.json")}"
OUT="$PROJECT_DIR/data/admin-policy.json"

TOKEN=$(curl -s -X POST "$TIDECLOAK_URL/realms/master/protocol/openid-connect/token" \
  --data-urlencode "grant_type=password" \
  --data-urlencode "client_id=admin-cli" \
  --data-urlencode "username=$KC_BOOTSTRAP_ADMIN_USERNAME" \
  --data-urlencode "password=$KC_BOOTSTRAP_ADMIN_PASSWORD" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: could not get a master-admin token" >&2
  exit 1
fi

RESP=$(curl -s -w '\n%{http_code}' \
  "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/role-policies/name/tide-realm-admin" \
  -H "Authorization: Bearer $TOKEN")
CODE=$(printf '%s' "$RESP" | tail -1)
BODY=$(printf '%s' "$RESP" | sed '$d')

if [ "$CODE" != "200" ]; then
  echo "ERROR: GET role-policies returned $CODE: $BODY" >&2
  echo "Has tide-realm-admin been granted yet? The policy only exists after that grant." >&2
  exit 1
fi

POLICY=$(printf '%s' "$BODY" | jq -r '.policy // empty')
if [ -z "$POLICY" ]; then
  echo "ERROR: response has no 'policy' field: $BODY" >&2
  exit 1
fi

jq -n --arg policy "$POLICY" '{policy: $policy}' > "$OUT"
echo "==> Saved admin policy to $OUT"
