#!/bin/sh
set -eu

if [ -z "${MCP_BEARER_TOKEN:-}" ]; then
  echo "MCP_BEARER_TOKEN must be set" >&2
  exit 1
fi

MCP_EMAIL_READ_ONLY=true MCP_EMAIL_VERIFICATION_ENABLED=false MCP_EMAIL_CACHE_ENABLED=false \
  node /app/dist/main.js http --host 127.0.0.1 --port 8081 --path /mcp &
email_pid=$!

node /app/proxy.mjs &
proxy_pid=$!

cleanup() {
  kill "$proxy_pid" "$email_pid" 2>/dev/null || true
  wait "$proxy_pid" "$email_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

while kill -0 "$proxy_pid" 2>/dev/null && kill -0 "$email_pid" 2>/dev/null; do
  sleep 1
done

echo "A child process exited; stopping container so the orchestrator can restart it" >&2
exit 1
