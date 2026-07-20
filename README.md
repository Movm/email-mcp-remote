# email-mcp-remote

A small, security-focused deployment wrapper for
[`codefuturist/email-mcp`](https://github.com/codefuturist/email-mcp).

It keeps the upstream server unchanged and adds HTTP Bearer authentication in
front of its Streamable HTTP `/mcp` endpoint. Unauthenticated requests receive
an MCP-client-friendly response:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="email-mcp"
```

The `/health` endpoint remains unauthenticated for container health checks.

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

## Endpoints

- `GET /health` — public health probe
- `/mcp` — Streamable HTTP MCP, requires `Authorization: Bearer <token>`

## License and upstream

This wrapper is licensed under MIT. The bundled upstream image is maintained by
codefuturist and licensed separately under LGPL-3.0-or-later. Review the
upstream repository and license before redistribution.
