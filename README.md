# email-mcp-remote

A small, security-focused deployment wrapper for
[`codefuturist/email-mcp`](https://github.com/codefuturist/email-mcp).

It keeps the upstream server unchanged and adds a small Node.js reverse proxy
with HTTP Bearer authentication in front of its Streamable HTTP `/mcp`
endpoint. Unauthenticated requests receive an MCP-client-friendly response:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="email-mcp"
```

The `/health` endpoint remains unauthenticated for container health checks.
If either the upstream MCP process or the authentication proxy exits, the
wrapper stops the container so the deployment platform can restart it cleanly.

The wrapper currently disables the upstream `check_health` MCP tool. In the
pinned `0.2.3` image, an ImapFlow socket timeout can be emitted outside the
tool's `try/catch` and terminate the server process. The HTTP `/health` endpoint
and normal read tools remain available. The build deliberately fails if the
expected upstream registration code changes, so this compatibility patch cannot
silently drift across upstream releases.

## Configuration

Set `MCP_BEARER_TOKEN` to a strong random secret. All upstream
`MCP_EMAIL_*` variables are passed through unchanged. For a read-only mailbox,
set `MCP_EMAIL_READ_ONLY=true`.

```bash
docker build -t email-mcp-remote .
docker run --rm -p 8080:8080 \
  -e MCP_BEARER_TOKEN='replace-me' \
  -e MCP_EMAIL_READ_ONLY=true \
  email-mcp-remote
```

Never bake mailbox passwords or bearer tokens into the image, repository, or
container labels. Store them as runtime secrets in your deployment platform.

For the currently hosted Coolify instance, `coolify-labels.txt` contains the
non-secret Traefik routing labels. Authentication is deliberately enforced by
the container instead of matching a secret in a Traefik router rule; this lets
clients discover Bearer authentication from the standards-compliant `401`
challenge.

## Endpoints

- `GET /health` — public health probe
- `/mcp` — Streamable HTTP MCP, requires `Authorization: Bearer <token>`

## License and upstream

This wrapper is licensed under MIT. The bundled upstream image is maintained by
codefuturist and licensed separately under LGPL-3.0-or-later. Review the
upstream repository and license before redistribution.
