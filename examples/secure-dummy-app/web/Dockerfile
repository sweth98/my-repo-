# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Stage 1 - build the bundle
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

# NODE_ENV is deliberately not set to production here - vite and typescript are
# devDependencies and npm ci would skip them.
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 - serve
# ---------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Only the compiled output crosses the stage boundary. Source, node_modules and
# any .env stay behind in the build stage and never exist in a shipped layer.
COPY --from=build /app/dist /usr/share/nginx/html

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:8080/healthz"]
