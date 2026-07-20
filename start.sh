#!/bin/sh
set -eu

if [ -z "${MCP_BEARER_TOKEN:-}" ]; then
  echo "MCP_BEARER_TOKEN must be set" >&2
  exit 1
fi

node /app/dist/main.js http 8081 &
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
