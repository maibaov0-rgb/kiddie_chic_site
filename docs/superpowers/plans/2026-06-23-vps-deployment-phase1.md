# VPS Deployment Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: this plan operates on a LIVE server (5.189.167.89) running another production site. Execute INLINE (superpowers:executing-plans), not via cold subagents — steps need interactive password-SSH and continuous live-server awareness. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Deploy kiddie_chic (Next.js + Postgres) on the VPS at a temporary port `http://5.189.167.89:8090`, fully isolated from the existing `site_with_skills`/pearl-of-art stack, and verify the full admin flow end-to-end.

**Architecture:** A separate Docker Compose project at `/root/kiddie_chic`: a `db` (postgres:16-alpine, NOT published to host) + a `web` (our Next.js, built on the server, published `8090:3000`). Migrations run on container start; admin user seeded once. The existing site keeps owning 80/443 and is never touched.

**Tech Stack:** Docker + Docker Compose (server-side), Node 22 alpine image, Next.js 16, Prisma 7 (pg driver adapter), PostgreSQL 16.

## Global Constraints

- Secrets ONLY in the server-side `.env` (never in git, never inlined in code/scripts, never in the spec/plan).
- Phase 1 makes ZERO changes to `/root/site_with_skills` or its containers/ports. Verify pearl-of-art stays up on 80/443 after every server-touching task.
- Postgres port 5432 is NOT published to the host.
- Server access is `root@5.189.167.89` via password (interactive; controller uses an authenticated SSH wrapper). Run only the commands in this plan; nothing destructive to the existing stack.
- Deploy the merged `main` (admin feature + deploy artifacts), not a feature branch tip.
- After deploy: advise the user to rotate Cloudinary keys (exposed in chat).

---

### Task 1: Merge admin feature into main

**Files:** none (git operation)

- [ ] **Step 1: Verify tests pass on the feature branch**

Run: `npx tsx --test lib/slug.test.ts lib/cloudinary.test.ts lib/validation/product.test.ts && npm run lint && npm run typecheck`
Expected: 11/11 tests pass; lint and typecheck clean.

- [ ] **Step 2: Merge into main**

```bash
git checkout main
git merge --no-ff feat/admin-products-crud -m "merge: admin products CRUD"
```
Expected: fast/clean merge (no conflicts — main has not advanced).

- [ ] **Step 3: Verify main builds**

Run: `npm run build`
Expected: build succeeds.

---

### Task 2: Production deploy artifacts in repo

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.prod.yml`
- Modify: `.env.example`

**Interfaces:**
- Produces: a buildable image and a compose project the server tasks consume. `web` listens on container port 3000; compose publishes `8090:3000`. `db` service hostname is `db`.

Note: We keep full `node_modules` in the runtime image (not Next standalone) so the Prisma CLI is available for `migrate deploy`/seed — operational simplicity over image size; the server has ample disk/RAM. This is a deliberate refinement of the spec's "standalone" note.

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
# Build stage — install all deps, generate Prisma client, build Next.js
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* are inlined at build time
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
RUN npx prisma generate && npm run build

# Runtime stage — full deps kept so `prisma migrate deploy` works on start
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
# migrate is idempotent and safe to run on every start; then launch Next
CMD ["sh","-c","npx prisma migrate deploy && npx next start -p 3000 -H 0.0.0.0"]
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
.next
.git
.env
.env.local
docs
.superpowers
npm-debug.log
*.log
```

- [ ] **Step 3: Create `docker-compose.prod.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: kiddie_chic_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - kc_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    # NOTE: no `ports:` — Postgres stays internal to the compose network

  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
    container_name: kiddie_chic_web
    restart: unless-stopped
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8090:3000"

volumes:
  kc_pgdata:
```

- [ ] **Step 4: Update `.env.example`** — append a production section documenting the variable names (no values):

```
# ── Production (server .env only; NEVER commit real values) ───────────────────
# DATABASE_URL="postgresql://kc_user:CHANGE_ME@db:5432/kiddie_chic"
# POSTGRES_USER=kc_user
# POSTGRES_PASSWORD=CHANGE_ME
# POSTGRES_DB=kiddie_chic
# NEXTAUTH_URL="http://5.189.167.89:8090"
# NEXT_PUBLIC_APP_URL="http://5.189.167.89:8090"
```

- [ ] **Step 5: Confirm `package-lock.json` exists (required by `npm ci`)**

Run: `ls package-lock.json`
Expected: file exists. If absent, run `npm install` to generate it and commit it.

- [ ] **Step 6: Lint + typecheck + build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all pass. (Local `docker build` is skipped — the Docker daemon is not running locally; the image builds on the server in Task 4.)

- [ ] **Step 7: Commit (on a deploy branch off main)**

```bash
git checkout -b feat/vps-deploy
git add Dockerfile .dockerignore docker-compose.prod.yml .env.example package-lock.json
git commit -m "build: production Dockerfile + compose for VPS deploy"
```

---

### Task 3: Server prep (swap + project dir) — non-invasive

**Files:** none (server operations)

- [ ] **Step 1: Baseline — record existing site is healthy**

Remote: `docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep pearl-of-art`
Expected: `pearl-of-art` (web) shows `0.0.0.0:80->80, 0.0.0.0:443->443` up; api + certbot up. Record this — it must look identical at the end.

- [ ] **Step 2: Add 2 GB swap (idempotent)**

Remote:
```bash
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon --show
```
Expected: `/swapfile … 2G` listed.

- [ ] **Step 3: Create the project directory**

Remote: `mkdir -p /root/kiddie_chic && echo ok`
Expected: `ok`.

- [ ] **Step 4: Confirm existing site still healthy**

Remote: `docker ps --format '{{.Names}} {{.Status}}' | grep pearl-of-art`
Expected: same containers up as Step 1.

---

### Task 4: Ship code + build image on the server

**Files:** none (transfer + build)

- [ ] **Step 1: Create a clean source tarball locally (exclude junk)**

Run:
```bash
git archive --format=tar.gz -o /tmp/pw-shot/kiddie_chic.tgz HEAD
ls -la /tmp/pw-shot/kiddie_chic.tgz
```
Expected: tarball created (uses committed tree → no node_modules/.env).

- [ ] **Step 2: Copy tarball to server (authenticated scp)**

Copy `/tmp/pw-shot/kiddie_chic.tgz` → `root@5.189.167.89:/root/kiddie_chic/src.tgz`.
Expected: transfer completes.

- [ ] **Step 3: Extract on server**

Remote: `cd /root/kiddie_chic && tar xzf src.tgz && rm src.tgz && ls Dockerfile docker-compose.prod.yml`
Expected: both files listed.

- [ ] **Step 4: Build the image**

Remote: `cd /root/kiddie_chic && NEXT_PUBLIC_APP_URL=http://5.189.167.89:8090 NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dkx2i9p6a docker compose -f docker-compose.prod.yml build web 2>&1 | tail -30`
Expected: build succeeds ("naming to … kiddie_chic-web"). If `next build` fails on prerendering an admin page that needs request context, add `export const dynamic = "force-dynamic";` to the offending `app/admin/.../page.tsx`, re-ship (Task 4 Step 1-3), rebuild.

---

### Task 5: Server `.env`, database up, migrate + seed

**Files:** `/root/kiddie_chic/.env` on server (NOT in git)

- [ ] **Step 1: Write the server `.env`** (real secret values — provided out-of-band, never committed). Variable set:
```
POSTGRES_USER=kc_user
POSTGRES_PASSWORD=<generate strong>
POSTGRES_DB=kiddie_chic
DATABASE_URL=postgresql://kc_user:<same pwd>@db:5432/kiddie_chic
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://5.189.167.89:8090
NEXT_PUBLIC_APP_URL=http://5.189.167.89:8090
ADMIN_EMAIL=<user choice>
ADMIN_PASSWORD=<user choice>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dkx2i9p6a
CLOUDINARY_API_KEY=<provided>
CLOUDINARY_API_SECRET=<provided>
RESEND_API_KEY=
RESEND_FROM_EMAIL=orders@example.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
MONOBANK_TOKEN=
MONOBANK_WEBHOOK_SECRET=
NOVA_POSHTA_API_KEY=
```
Generate the DB password and AUTH_SECRET on the server; type/paste Cloudinary + admin values. Then: `chmod 600 /root/kiddie_chic/.env`.

- [ ] **Step 2: Start the database only**

Remote: `cd /root/kiddie_chic && docker compose -f docker-compose.prod.yml up -d db && sleep 5 && docker compose -f docker-compose.prod.yml ps`
Expected: `kiddie_chic_db` healthy. Confirm no host port 5432: `ss -tlnp | grep ':5432' || echo "5432 not exposed (good)"` → expect "not exposed".

- [ ] **Step 3: Run migrations**

Remote: `cd /root/kiddie_chic && docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy 2>&1 | tail -20`
Expected: migrations applied (tables created). If "No migration found in prisma/migrations" — the repo has no migration files; instead run `... run --rm web npx prisma db push` to sync the schema, and note it in the report.

- [ ] **Step 4: Seed the admin user**

Remote: `cd /root/kiddie_chic && docker compose -f docker-compose.prod.yml run --rm web npm run db:seed 2>&1 | tail -20`
Expected: admin user created. (Seed reads ADMIN_EMAIL/ADMIN_PASSWORD from `.env`.)

---

### Task 6: Bring up web + smoke test

**Files:** none

- [ ] **Step 1: Start web**

Remote: `cd /root/kiddie_chic && docker compose -f docker-compose.prod.yml up -d web && sleep 8 && docker compose -f docker-compose.prod.yml ps`
Expected: `kiddie_chic_web` up; `8090->3000` published.

- [ ] **Step 2: Smoke test the login page**

Remote: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/admin/login`
Expected: `200`.

- [ ] **Step 3: Smoke test redirect protection**

Remote: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/admin/products`
Expected: `307`/`302` (redirect to login) — confirms middleware protects routes.

- [ ] **Step 4: Confirm the existing site is UNAFFECTED**

Remote: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:80` and `docker ps --format '{{.Names}} {{.Status}}' | grep pearl-of-art`
Expected: pearl-of-art still serving on 80; same containers up as Task 3 Step 1.

- [ ] **Step 5: Check web logs for errors**

Remote: `cd /root/kiddie_chic && docker compose -f docker-compose.prod.yml logs --tail=40 web`
Expected: "Ready" / listening on 3000; no fatal errors.

---

### Task 7: Full browser verification (the verify that was blocked locally)

**Files:** none (uses superpowers:verify against the live temp URL)

- [ ] **Step 1: Drive a browser to `http://5.189.167.89:8090`** and walk the flow at 375px then desktop:
  1. `/admin/products` while logged out → redirected to `/admin/login`.
  2. Log in with the seeded ADMIN_EMAIL/ADMIN_PASSWORD → land on `/admin/products`.
  3. "Додати товар" → fill UA/EN name + description, category, upload ≥1 real photo (confirm it lands in Cloudinary `dkx2i9p6a` and preview renders), add a variant with a price → "Створити товар".
  4. New product appears in the list with thumbnail + price.
  5. Edit it (change a flag + price) → "Зберегти зміни" → persisted.
  6. Delete it → removed from list.
  7. "Вийти" → back to login.

Expected: every step works; layout clean/tappable at 375px; no console errors; uploaded image URL is on `res.cloudinary.com/dkx2i9p6a/...`.

- [ ] **Step 2: Final isolation check**

Remote: `docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'`
Expected: both stacks coexisting — pearl-of-art on 80/443, kiddie_chic_web on 8090, kiddie_chic_db with no host port.

- [ ] **Step 3: Advise Cloudinary key rotation** and summarize Phase 1 result; Phase 2 (domain + HTTPS) is a separate spec.

---

## Self-Review

**Spec coverage:**
- Isolated compose project, db not published, web on 8090 → Tasks 2, 5, 6. ✓
- Dockerfile/compose/.dockerignore/.env.example/next.config → Task 2 (next.config standalone intentionally dropped; rationale noted). ✓
- Merge admin→main, deploy main → Task 1. ✓
- Server .env with named secrets, generated AUTH_SECRET/pwd → Task 5. ✓
- Swap 2 GB → Task 3. ✓
- Migrate + seed → Task 5. ✓
- Browser verify full admin flow + Cloudinary → Task 7. ✓
- Zero changes to site_with_skills; verify pearl-of-art up → Tasks 3, 6, 7. ✓
- Key rotation advice → Task 7. ✓
- Phase 2 explicitly out of scope. ✓

**Placeholder scan:** No TBD/TODO. Secret VALUES are intentionally not in the plan (they belong only in the server `.env`); variable names and sources are fully specified — this is a security requirement, not a placeholder gap.

**Consistency:** Service names (`db`, `web`), container names, port `8090:3000`, cloud name `dkx2i9p6a`, and paths (`/root/kiddie_chic`) are consistent across tasks. Compose file referenced as `docker-compose.prod.yml` throughout.

> Open risk flagged for execution: if `prisma/migrations/` has no committed migration files, Task 5 Step 3 falls back to `prisma db push` (the schema is the source of truth). Confirm which during execution.
