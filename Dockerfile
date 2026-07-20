FROM caddy:2.10.2 AS caddy

FROM ghcr.io/codefuturist/email-mcp:0.2.3

USER root
COPY --from=caddy /usr/bin/caddy /usr/local/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /usr/local/bin/start-email-mcp
RUN chmod 0755 /usr/local/bin/start-email-mcp

EXPOSE 8080
USER node

ENTRYPOINT ["/usr/local/bin/start-email-mcp"]
