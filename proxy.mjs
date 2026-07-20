import { createServer, request } from 'node:http';

const listenPort = 8080;
const upstreamPort = 8081;
const bearerToken = process.env.MCP_BEARER_TOKEN;

if (!bearerToken) {
  throw new Error('MCP_BEARER_TOKEN must be set');
}

function forward(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${upstreamPort}` };
  const upstream = request(
    {
      hostname: '127.0.0.1',
      port: upstreamPort,
      method: req.method,
      path: req.url,
      headers,
    },
    (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    },
  );

  upstream.on('error', (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'upstream_unavailable' }));
    process.stderr.write(`[email-mcp-proxy] upstream error: ${error.message}\n`);
  });

  req.pipe(upstream);
}

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;

  if (path === '/health') {
    forward(req, res);
    return;
  }

  if (path !== '/mcp') {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  if (req.headers.authorization !== `Bearer ${bearerToken}`) {
    res.writeHead(401, {
      'cache-control': 'no-store',
      'content-type': 'application/json',
      'www-authenticate': 'Bearer realm="email-mcp"',
    });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }

  forward(req, res);
}).listen(listenPort, '0.0.0.0', () => {
  process.stderr.write(`[email-mcp-proxy] listening on :${listenPort}\n`);
});
