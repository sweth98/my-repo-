# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Stage 1 - production dependencies only
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# --omit=dev keeps test and tooling packages out of the shipped image: code
# that never runs in production is still code an attacker can reach.
# --ignore-scripts blocks postinstall hooks, the usual supply-chain entry point.
RUN npm ci --omit=dev --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 2 - runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# The node images already provide an unprivileged `node` user (uid 1000).
# Files are owned by it so nothing needs to be writable by root.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# Drop privileges. Everything from here runs as uid 1000.
USER node

EXPOSE 3000

# Node 22 ships a global fetch, so the healthcheck needs no curl or wget in the
# image - one less binary for an attacker to use.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "src/server.js"]
