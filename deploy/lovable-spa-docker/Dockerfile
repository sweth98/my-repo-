# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Stage 1 - build the static bundle
# ---------------------------------------------------------------------------
# Pin to a specific minor tag. For a stronger guarantee, replace the tag with a
# digest (docker buildx imagetools inspect node:22-alpine) so the base image can
# never change underneath you:
#   FROM node:22-alpine@sha256:<digest> AS build
FROM node:22-alpine AS build

WORKDIR /app

# Vite inlines every VITE_* variable into the JavaScript bundle at build time.
# Anything passed here ships to the browser and is PUBLIC. The Supabase anon key
# belongs here; a service_role key, Stripe secret, or SMTP password never does.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Copy manifests first so the dependency layer stays cached across source edits.
COPY package.json package-lock.json ./

# npm ci installs exactly what the lockfile pins - no silent version drift.
# --ignore-scripts blocks postinstall hooks, the usual supply-chain entry point.
# If a dependency genuinely needs its install script, drop the flag and pin that
# dependency by digest instead.
#
# NODE_ENV is deliberately NOT set to production here: vite and the TypeScript
# toolchain are devDependencies, and npm ci would skip them.
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 - serve the bundle
# ---------------------------------------------------------------------------
# nginx-unprivileged runs as uid 101 and listens on 8080, so the container needs
# no root user and no CAP_NET_BIND_SERVICE.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Replace the stock server block with the hardened one.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Only the compiled output crosses into the runtime image. Source, node_modules,
# .git and any .env file stay behind in the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:8080/healthz"]
