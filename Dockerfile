FROM ghcr.io/codefuturist/email-mcp:0.2.3

USER root
COPY proxy.mjs /app/proxy.mjs
COPY start.sh /usr/local/bin/start-email-mcp
RUN chmod 0755 /usr/local/bin/start-email-mcp

EXPOSE 8080
USER node

ENTRYPOINT ["/usr/local/bin/start-email-mcp"]
