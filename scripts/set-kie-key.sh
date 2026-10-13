#!/usr/bin/env bash
# Store the kie.ai API key in .kie.env (gitignored) without echoing it.
set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.kie.env"

read -rsp "Paste your kie.ai API key (input hidden): " key
echo
key="${key//[[:space:]]/}"
[ -n "$key" ] || { echo "No key entered; nothing written." >&2; exit 1; }

umask 077
printf 'KIE_API_KEY=%s\n' "$key" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

code=$(curl -s -H "Authorization: Bearer $key" https://api.kie.ai/api/v1/chat/credit \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("code"), d.get("data"))' 2>/dev/null || true)
case "$code" in
  "200 "*) echo "Saved to $ENV_FILE. Key works, credits: ${code#200 }" ;;
  *)       echo "Saved to $ENV_FILE, but the key check failed (response: ${code:-none})." >&2 ;;
esac
