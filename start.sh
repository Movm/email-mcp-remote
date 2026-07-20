#!/bin/sh
set -eu

if [ -z "${MCP_BEARER_TOKEN:-}" ]; then
  echo "MCP_BEARER_TOKEN must be set" >&2
  exit 1
fi

node /app/dist/main.js http 8081 &
email_pid=$!

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy_pid=$!

cleanup() {
  kill "$caddy_pid" "$email_pid" 2>/dev/null || true
  wait "$caddy_pid" "$email_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM
wait "$caddy_pid"
