# Running a Lovable app locally in Docker

A hardened container setup for a Lovable-generated Vite + React + TypeScript
app backed by Supabase.

These files are written to live at the **root of your app repository**, not
here. This directory is a template you copy from.

---

## Before Docker: the security issue that actually matters

Container hardening protects the *server*. For a Lovable + Supabase app, the
realistic attack doesn't go through the container at all — it goes straight to
Supabase from the browser.

Your frontend ships the Supabase URL and anon key to every visitor. That is by
design and is not a leak. The anon key is a *routing* credential, not a secret;
the thing standing between a stranger and your entire database is **Row Level
Security**. If RLS is off on a table, anyone who opens DevTools can read and
write that table directly, and no amount of Docker configuration changes that.

Before you deploy anywhere, in the Supabase dashboard:

1. **Table Editor → every table → confirm RLS is enabled.** Supabase warns with
   an "Unrestricted" badge on tables that lack it.
2. **Check the policies, not just the toggle.** A policy of `USING (true)` is
   RLS that permits everything — enabled but not enforcing.
3. **Confirm no `service_role` key appears anywhere in your frontend source.**
   From your app repo:
   ```bash
   grep -rn "service_role\|SUPABASE_SERVICE" src/ || echo "clean"
   ```
   That key bypasses RLS entirely. It belongs only in an Edge Function.
4. **Verify a signed-out read is refused.** Substitute your values:
   ```bash
   curl "https://YOUR-PROJECT-REF.supabase.co/rest/v1/YOUR_TABLE?select=*" \
     -H "apikey: YOUR_ANON_KEY"
   ```
   Rows coming back for a table that should be private means RLS is not doing
   its job. An empty array or a permission error is the healthy result.

Do this first. The rest of this document is worth much less if step 1 fails.

---

## Step 1 — get the source

`https://ayurvedic-harvest-hub.lovable.app` serves a compiled bundle. Docker
builds from source, so you need the repo:

In Lovable, open your project → **GitHub → Connect to GitHub** (top right) and
sync. Then:

```bash
git clone https://github.com/<your-username>/ayurvedic-harvest-hub.git
cd ayurvedic-harvest-hub
```

Sanity-check the stack before continuing — this setup assumes Vite:

```bash
cat package.json   # expect "vite" in devDependencies and a "build" script
ls package-lock.json
```

If you see `bun.lockb` instead of `package-lock.json`, see *Adjustments* below.

## Step 2 — copy these files in

From this template directory into your app repo root:

```
Dockerfile
docker-compose.yml
.dockerignore
nginx/default.conf
nginx/security-headers.conf
.env.example
```

## Step 3 — configure

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key — both are in the Supabase
dashboard under **Project Settings → API**. Then confirm the file is ignored:

```bash
git check-ignore -v .env    # must print a matching rule
```

If it prints nothing, add `.env` to `.gitignore` immediately.

Now edit **`nginx/security-headers.conf`** and replace both
`YOUR-PROJECT-REF.supabase.co` placeholders in the `connect-src` directive with
your real project host. Skipping this breaks every API call — the CSP will
block them.

## Step 4 — build and run

```bash
docker compose up --build -d
docker compose ps          # STATUS should reach "healthy"
```

Open **http://localhost:8080**.

Then open DevTools → Console and click through the app. A `Refused to
connect/load … Content Security Policy` error means a host is missing from the
CSP — add it to the matching directive in `nginx/security-headers.conf` and
`docker compose up -d --build` again. Fix these rather than deleting the CSP;
it's the header doing the most work.

Useful afterwards:

```bash
docker compose logs -f web     # tail logs
docker compose down            # stop and remove
docker compose up -d --build   # rebuild after a code change
```

---

## What makes this setup hardened

| Control | Where | What it stops |
|---|---|---|
| Multi-stage build | `Dockerfile` | Source, `node_modules`, `.git` and any `.env` never reach the shipped image — only `dist/` does |
| `nginx-unprivileged`, `USER 101` | `Dockerfile` | No root process in the container; a server compromise starts unprivileged |
| `npm ci --ignore-scripts` | `Dockerfile` | Exact lockfile versions, and no `postinstall` hook execution — the common supply-chain path |
| `read_only: true` + tmpfs | `docker-compose.yml` | Immutable filesystem; an attacker has nowhere to write a payload |
| `cap_drop: ALL`, `no-new-privileges` | `docker-compose.yml` | Removes every Linux capability and the setuid escalation route |
| `127.0.0.1:8080` binding | `docker-compose.yml` | Docker's iptables rules otherwise bypass your host firewall and expose the app to your whole network |
| `pids_limit`, `mem_limit`, `cpus` | `docker-compose.yml` | Caps the damage from resource exhaustion |
| CSP + 5 companion headers | `nginx/security-headers.conf` | XSS execution, clickjacking, MIME sniffing, referrer leakage |
| Dotfile/`.env`/sourcemap denial | `nginx/default.conf` | Serving a secret or your original TypeScript if one ever lands in `dist/` |
| `server_tokens off` | `nginx/default.conf` | Version disclosure that makes CVE matching easy |
| Immutable asset caching, no-store HTML | `nginx/default.conf` | Stale-bundle breakage after a redeploy |

### Scan the image

```bash
docker scout cves ayurvedic-harvest-hub:local
# or
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ayurvedic-harvest-hub:local
```

Rebuild periodically — a base image that was clean last month usually isn't.
Also run `npm audit --omit=dev` against your dependencies.

### Verify the headers landed

```bash
curl -sI http://localhost:8080 | grep -i -E "content-security|x-content-type|referrer|permissions|frame"
```

---

## Troubleshooting

**Container restarts in a loop / "read-only file system" in the logs.** An nginx
entrypoint script wanted to rewrite a config file. Confirm with
`docker compose logs web`, then temporarily set `read_only: false` to identify
which path it wants and add that path as a `tmpfs` entry rather than leaving the
filesystem writable.

**Blank page, console shows a `Refused to …` CSP error.** Expected on first run
until you replace the Supabase placeholder host in
`nginx/security-headers.conf`. Add the reported host to the directive named in
the error.

**Blank page, no console errors, network tab shows 404s for `/assets/*`.** The
build produced output somewhere other than `dist/`. Check the `build.outDir`
setting in `vite.config.ts` and update the `COPY --from=build` line to match.

**`npm ci` fails with a lockfile mismatch.** `package.json` and
`package-lock.json` are out of sync — run `npm install` locally, commit the
updated lockfile, and rebuild.

## Adjustments

**Bun lockfile.** If your repo has `bun.lockb` rather than `package-lock.json`,
switch the build stage to `FROM oven/bun:1-alpine AS build` and replace the two
npm lines with `COPY package.json bun.lockb ./` and `RUN bun install --frozen-lockfile`.

**Different env var names.** Check what your code actually reads:
```bash
grep -rn "import.meta.env" src/
```
Every name you find must appear as an `ARG` in the Dockerfile *and* in the
compose `build.args` block, or it will be `undefined` in the bundle.

**Port already in use.** Change the host side only: `"127.0.0.1:3000:8080"`.

**Local HTTPS**, if you need to test secure cookies or a service worker:
```bash
mkcert -install && mkcert localhost 127.0.0.1
```
Mount the resulting pair read-only into the container, add a `listen 8443 ssl;`
block to `nginx/default.conf` pointing at them, and publish
`127.0.0.1:8443:8443`. Only then is it safe to uncomment the HSTS header.

## Deliberate limits

- This serves the frontend only. Supabase stays hosted — the container talks to
  it over the network. Running Supabase locally too is a separate setup
  (`supabase start` via the Supabase CLI, which brings up Postgres, GoTrue and
  the REST API in their own containers).
- Local Docker is a *runtime*, not an exposure. Don't port-forward `8080` to the
  internet from a laptop. For a real deployment put a TLS-terminating reverse
  proxy in front, enable HSTS, and rebuild the image on a schedule for base
  image patches.
