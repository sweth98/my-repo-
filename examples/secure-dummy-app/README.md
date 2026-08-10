# Secure dummy app

A small, complete, deliberately-hardened app for exercising a Docker
deployment end to end. Two containers:

```
                    ┌──────────────────────── host ────────────────────────┐
  browser ──▶ 127.0.0.1:8080 ──▶ │  web (nginx)  │ ──/api/──▶ │  api (node) │
                                 │  static bundle│            │  secrets    │
                    └──────────────────────────────────────────────────────┘
                                    frontend net      backend net (internal)
```

- **web** — Vite + React + TypeScript built to static files, served by
  unprivileged nginx. The only container with a published port.
- **api** — Node + Express. Holds the session secret and password hash. Has
  **no published port at all** and sits on a network with no route to the
  internet.

## Run it

Requires Docker with Compose v2, and node on the host for the one-time secret
generation.

```bash
cd examples/secure-dummy-app
./generate-secrets.sh          # writes .env, prints a random password once
docker compose up --build -d
docker compose ps              # both services should reach "healthy"
```

Open <http://localhost:8080>, then sign in with `demo` and the password the
script printed. Signed out you can read the inventory; adding an item requires
a session.

```bash
docker compose logs -f          # follow both services
docker compose down             # stop and remove
```

## Prove the security properties yourself

Each of these is a control you can watch working, not a claim to take on faith.

**The API is genuinely unreachable from the host.** There is no `ports:` entry
for it — the only way in is nginx's `/api/` proxy.

```bash
curl -sS --max-time 3 http://localhost:3000/api/health   # connection refused
curl -s http://localhost:8080/api/health                 # {"status":"ok"}
```

**Secrets are not in the frontend bundle.** This is the difference that matters
between a server-side env var and a Vite `VITE_*` one:

```bash
docker compose exec web sh -c 'grep -r "SESSION_SECRET\|scrypt" /usr/share/nginx/html || echo "not present"'
```

**Auth is enforced by the server, not by hiding the form.**

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'content-type: application/json' -d '{"name":"x","stock":1}' \
  http://localhost:8080/api/items          # 401
```

**Sessions cannot be forged.** The cookie is `HttpOnly; SameSite=Strict` and
carries an HMAC. Edit any character of it and the API rejects it.

**Unexpected fields are refused,** so a client cannot smuggle extra properties
into a stored object:

```bash
curl -s -X POST -H 'content-type: application/json' \
  -d '{"name":"Evil","stock":1,"isAdmin":true}' \
  http://localhost:8080/api/items          # 400 invalid item
```

**The filesystem is immutable:**

```bash
docker compose exec web sh -c 'echo x > /usr/share/nginx/html/pwn.js'
# sh: can't create ...: Read-only file system
```

**Nothing runs as root:**

```bash
docker compose exec web id     # uid=101
docker compose exec api id     # uid=1000(node)
```

**Security headers are present:**

```bash
curl -sI http://localhost:8080 | grep -iE 'content-security|x-frame|x-content-type|referrer|permissions'
```

## Automated checks

The API ships a smoke test asserting 24 security behaviours — config
validation, auth, session integrity, input validation, and rate limiting:

```bash
cd api && npm install && npm run smoke
```

It boots the server on a scratch port with throwaway credentials, so it needs
no `.env` and touches nothing you have running.

## What is being demonstrated

| Control | Where | Why |
|---|---|---|
| API has no published port | `docker-compose.yml` | Only reachable through nginx; nothing on your LAN can touch it |
| `backend` network is `internal: true` | `docker-compose.yml` | A compromised API container has no outbound route to call home |
| `127.0.0.1:8080` binding | `docker-compose.yml` | Docker's iptables rules otherwise bypass the host firewall |
| `read_only` + tmpfs, `cap_drop: ALL`, `no-new-privileges` | `docker-compose.yml` | Nowhere to write a payload, no capabilities, no setuid escalation |
| Non-root users (101 / 1000) | both Dockerfiles | A server compromise starts unprivileged |
| Multi-stage builds | both Dockerfiles | Source, `node_modules` and `.git` never exist in a shipped layer |
| `npm ci --ignore-scripts` | both Dockerfiles | Exact lockfile versions, no `postinstall` execution |
| Boot-time config validation | `api/src/config.js` | No silent fallback to a hardcoded dev secret |
| scrypt + `timingSafeEqual` | `api/src/auth.js` | Slow, memory-hard hashing; no timing oracle |
| HMAC session, verified before parse | `api/src/auth.js` | Unforgeable; no parsing of unauthenticated input |
| `HttpOnly; SameSite=Strict` cookie | `api/src/auth.js` | XSS cannot read it, CSRF cannot send it |
| Strict zod schemas | `api/src/server.js` | Unexpected fields rejected, not ignored |
| Two-tier rate limiting | `api/src/server.js` | 5 login attempts / 15 min per IP, forgery-resistant |
| Generic error responses | `api/src/server.js` | No stack traces or user-enumeration hints |
| CSP + 6 companion headers | `web/nginx/security-headers.conf` | XSS, clickjacking, MIME sniffing, referrer leakage |
| Same-origin proxy | `web/nginx/default.conf` | No CORS policy to misconfigure |

## Two subtleties worth understanding

**`trust proxy` is a hop count, and express counts the socket as hop 0.** With
`1`, `req.ip` resolves to the address *nginx observed*, so an `X-Forwarded-For`
a client invents is ignored and cannot be rotated to escape the rate limiter.
This is only sound because the API cannot be reached directly — publish its
port and a bare forged header becomes `req.ip`. The `ports:` omission is part
of the control.

**nginx's `add_header` does not inherit into a location that declares its own.**
Every location serving HTML re-includes `security-headers.conf`; the `/api/`
location deliberately does not, because helmet already sets those headers there
and two `Content-Security-Policy` headers get intersected by the browser.

## Deliberate limits

This is a teaching scaffold, not a production template.

- Items are stored **in memory** and reset when the container restarts.
- There is **one hardcoded demo user**, not a user store.
- Rate limiting is **per-process**; more than one API replica needs a shared
  store such as Redis.
- `COOKIE_SECURE=false` so the demo works over plain `http://localhost`. Set it
  to `true` behind real TLS, and only then uncomment the HSTS header in
  `web/nginx/security-headers.conf`.
- No TLS. Localhost only — do not port-forward this to the internet.
