# Developer Setup Guide

Welcome to the team. This guide gets your local development environment running
and explains how we work together as a team. Read it top to bottom once, then use
it as a reference.

## How we work

### Fork model

Only 3rd years and seniors have push access to the original repo
(`https://github.com/nalumnsut/nalum`). Everyone else — all 2nd years — works from
a personal fork and contributes back only through Pull Requests. Nobody but a 3rd
year ever pushes directly to `main` or `test` on the original repo.

- `main` is the production branch.
- `test` is where all in-progress work lands before it's considered done.
- You do your own work on **your fork** — on your fork's `main` branch
  (preferred), or any other branch there if you'd rather keep things separate.
  It's your own space, no naming convention required.
- When a piece of work is ready, push it to your fork, then open a Pull Request
  **from your fork into `test` on the original repo** — never into `main`.
  GitHub defaults a fork's PR to target the original repo's default branch, which
  is `main`, so **double-check the base branch is `test`** before you create the
  PR — this is an easy mistake to make.
- A 3rd year reviews and approves your PR before it merges into `test`.
- Once merged into `test`, the tester assigned to that piece of work tests it
  there (see "Working in pairs" below).
- Once testing passes, a 3rd year merges `test` into `main`.

See "2. Fork the repo and set up your clone" below for the exact commands.

---

## 1. Prerequisites — install these first

You need **Git**, **Node.js** (LTS, v20 or newer), and **Docker**. How you install
them depends on your OS:

### Windows

Windows needs WSL (Windows Subsystem for Linux) first — Docker Desktop runs on top
of it, and it gives you a proper Linux shell for everything else in this guide.

1. **WSL** — open PowerShell as Administrator and run:
   ```powershell
   wsl --install
   ```
   This installs WSL2 with Ubuntu by default and will ask you to restart. Full
   instructions if you hit issues:
   https://learn.microsoft.com/en-us/windows/wsl/install
2. **Git** — download and install from https://git-scm.com/downloads (choose
   Windows). Or, once WSL is set up, just use the Git that ships with your Linux
   distro (`sudo apt install git` inside WSL).
3. **Node.js** — download the LTS installer for Windows from
   https://nodejs.org/en/download. If you're working inside WSL, prefer installing
   Node there instead (via https://nodejs.org/en/download or `nvm`), so it matches
   the Linux instructions below.
4. **Docker Desktop** — download from
   https://www.docker.com/products/docker-desktop/, install, and make sure
   **"Use the WSL 2 based engine"** is enabled in Docker Desktop's settings
   (Settings → General). This lets you run all the `docker compose` commands in
   this guide from inside your WSL terminal.

Do the rest of this guide (cloning, `npm` commands, `docker compose` commands)
from inside your WSL terminal, not PowerShell/cmd.

### macOS

1. **Git** — already included with Xcode Command Line Tools; if needed, install
   with `xcode-select --install`, or get the latest from
   https://git-scm.com/downloads.
2. **Node.js** — download the LTS installer (macOS) from
   https://nodejs.org/en/download.
3. **Docker Desktop** — download from
   https://www.docker.com/products/docker-desktop/ (pick the correct build for
   Apple Silicon vs. Intel) and install it.

### Linux

1. **Git** — usually already installed; if not, use your distro's package
   manager (e.g. `sudo apt install git` on Debian/Ubuntu). Details:
   https://git-scm.com/downloads.
2. **Node.js** — install the LTS version via https://nodejs.org/en/download
   (or `nvm`, recommended if you'll ever need multiple Node versions).
3. **Docker Engine + Compose plugin** — follow the instructions for your
   distro at https://docs.docker.com/engine/install/. Docker Desktop also works
   on Linux (https://www.docker.com/products/docker-desktop/) if you prefer a GUI.

### Verify everything installed correctly

Run these (on Windows, from inside your WSL terminal):

```bash
git --version
node --version
npm --version
docker --version
docker compose version
```

Each should print a version number, not "command not found". You want Node
v20.x or newer. On Windows, also confirm WSL itself is set up:

```powershell
wsl --version
```

---

Optional, not required to get started — install later only if you want them:
- **MongoDB Compass** — GUI for browsing the database
- **A Postgres GUI** (e.g. TablePlus, pgAdmin) — for browsing the local
  `alumni` table; connect to `postgresql://postgres:alumni_dev@localhost:5433/postgres`

## 2. Fork the repo and set up your clone

1. Fork the repo on GitHub: open `https://github.com/nalumnsut/nalum` and click
   **Fork**. This creates `https://github.com/<your-username>/nalum` under your
   own account.
2. Clone your fork (not the original repo):
   ```bash
   git clone https://github.com/<your-username>/nalum.git
   cd nalum
   ```
3. Add the original repo as `upstream` — you'll use this to pull the `test`
   branch when it's your turn to test your pair's work:
   ```bash
   git remote add upstream https://github.com/nalumnsut/nalum.git
   ```
4. Confirm both remotes are set up:
   ```bash
   git remote -v
   # origin    -> your fork (fetch/push)
   # upstream  -> https://github.com/nalumnsut/nalum.git (fetch/push)
   ```
5. Before starting new work, sync your fork with upstream so you're not working
   off stale code:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

Do your work on your fork's `main` branch (preferred) or any other branch there,
then push to your fork (`git push origin main`) and open a PR into `test` on the
original repo — see "Fork model" above for details.

## 3. Create your local config files

You need to create 3 files — none of them are committed to the repo (see
`.gitignore`), so every developer creates their own copies locally.

### File 1 of 3 — `frontend/.env`

```bash
cp frontend/.env.example frontend/.env
```
The example values already work as-is, no changes needed:
```
VITE_API_URL_DEV=http://localhost:2478
VITE_API_URL_PROD=http://localhost
```

### File 2 of 3 — `backend/.env`

```bash
cp backend/.env.example backend/.env
```
Fill it in as follows:

```env
NODE_ENV=development
DEBUG_MAIL=true
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=7d

# Leave blank — Docker sets these directly, whatever you put here is ignored
PORT=
HOST=
MONGODB_URI=
REDIS_URL=
FRONTEND_URL=
POSTGRESQL_DATABASE_URL=

# Leave blank — DEBUG_MAIL=true logs verification/reset links to the console
# instead of actually sending mail, so you don't need real credentials here
BREVO_SMTP_HOST=
BREVO_SMTP_PORT=
BREVO_SMTP_USER=
MAIL_FROM_NAME=
MAIL_FROM_EMAIL=
BREVO_SMTP_PASS=

# Optional — only needed if you're testing push notifications
# Generate your own: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### File 3 of 3 — `docker-compose.override.yml`

Create this file yourself in the repo root (same folder as `docker-compose.yml`)
with exactly this content — this is what gives you hot reload and local
database access. Do not commit it; it's already covered by `.gitignore`.

```yaml
services:
  backend:
    environment:
      FRONTEND_URL: http://localhost:5173
      POSTGRESQL_DATABASE_URL: postgresql://postgres:alumni_dev@postgres:5432/postgres
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: sh -c "npm install && npm run dev"

  mongo:
    ports:
      - "127.0.0.1:27018:27017"
    volumes:
      - mongo_dev_data:/data/db

  redis:
    ports:
      - "127.0.0.1:6380:6379"

  postgres:
    image: postgres:16-alpine
    ports:
      - "127.0.0.1:5433:5432"
    environment:
      POSTGRES_PASSWORD: alumni_dev
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  mongo_dev_data:
  postgres_dev_data:
```

## 4. Postgres

Postgres runs locally in Docker automatically, alongside Mongo and Redis — no
real connection string needed for local dev. It's seeded with 1,000 fake
alumni records (see `npm run dev:seed` below), so the admin "Alumni Database"
pages work locally out of the box.

## 5. Start the backend, MongoDB, Redis, and Postgres (Docker)

```bash
npm run dev:up
```

This builds and starts the backend (with hot reload), MongoDB, Redis, and
Postgres. Leave it running in its terminal.

**First time only**, seed some demo data:
```bash
npm run dev:seed
```
This creates 10 alumni (`alumni1@gmail.com`...`alumni10@gmail.com`), 10 students
(`s1@nsut.ac.in`...`s10@nsut.ac.in`), and 1 admin (`devadmin@nsut.ac.in`) — all
with password `12345678`, all pre-verified so you can sign in immediately. It also
adds a handful of sample events, posts, and alumni connections so those pages
aren't empty either, plus 1,000 fake alumni records in the local Postgres
`alumni` table for the admin Alumni Database pages.

The seed data lives in `backend/scripts/seed/` — one file per collection
(`users.js`, `profiles.js`, `events.js`, `posts.js`, `connections.js`,
`alumni_pg.js`) plus `index.js`, which runs them all in order. If you need seed
data for a collection that isn't covered yet, add a new file following the
same pattern and wire it into `index.js`.

## 6. Start the frontend

In a second terminal:
```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

## 7. Daily workflow, once you're set up

```bash
npm run dev:up               # terminal 1
cd frontend && npm run dev   # terminal 2
```
Edit backend or frontend code — both reload automatically. No restart needed for
either. Stop everything with `npm run dev:down`.

## 8. Useful commands

- Start all 5 services including the unused Docker frontend build (only if you
  specifically want to check the production-style build locally):
  `npm run dev:up:all`
- View backend logs: `docker compose logs -f backend`
- Open a MongoDB shell: `docker compose exec mongo mongosh nalum`
- Open a Postgres shell: `docker compose exec postgres psql -U postgres`
- Save your uncommitted changes without committing (e.g. to switch branches
  temporarily): `git stash -u` — stashes modified and newly created files.
- Bring stashed changes back: `git stash pop`.
- Browse MongoDB with a GUI: connect Compass to `mongodb://localhost:27018/nalum`
- Browse Postgres with a GUI: connect to `postgresql://postgres:alumni_dev@localhost:5433/postgres`

---

## 9. Working in pairs

You'll be paired with another developer, who is also working from their own
fork. You're each assigned separate pieces of work — but you also test *each
other's* work once it's ready. When your own task is done and merged into
`test`, hand it to your pair to test; when they're done, you test theirs.

### 1. Development

Before you start a new piece of work, sync your fork's `main` with
`upstream/main` so you're building on the latest code, not something stale:
```bash
git checkout main
git fetch upstream
git merge upstream/main
```

Then do your work on `main` (preferred) or a separate branch in your fork. When
it's ready, push to your fork and open a PR into `test` on the original repo —
see "Fork model" above for details.

### 2. Testing

Testing always happens off the **original repo's `test` branch**, not off your
pair's fork — you don't need to know about or add your pair's individual fork as
a remote. You already have `upstream` (the original repo) set up from cloning.

Your fork already has its own `test` branch — GitHub copies all branches that
existed on the original repo at the moment you forked. But that copy is frozen
from fork time; it does **not** stay in sync automatically. So before testing,
sync your fork's local `test` branch to match `upstream/test` exactly:

**The first time**, check out your fork's `test` branch locally (it already
exists on `origin` from forking, you just need a local copy tracking it):
```bash
git checkout test
```

**Every time you go to test something**, sync it to the real latest state from
upstream before you look at anything:
```bash
git checkout test
git pull upstream test
```

This fast-forwards your local `test` branch to match `upstream/test` — it only
works cleanly because you never commit on this branch yourself, so there's
nothing to conflict with.

- Check the board card (or the PR description) for what the piece of work is
  supposed to do, then go do that in the browser: sign in with one of the seeded
  accounts if needed (`npm run dev:seed` first if you haven't seeded yet),
  exercise the actual feature, and try the obvious edge cases (empty input,
  wrong role signing in, etc.), not just the happy path.
- If something's broken, comment on the PR (or message your pair directly) with
  what you did and what went wrong, so they can fix it on the same PR — don't
  move the card to **Done** until a re-test passes.
- If it works, move the card to **Done** yourself.

### 3. Board (To Do / Testing / Done)

All work is tracked on the team board in three columns:
- **To Do** — a senior assigns work here.
- **Testing** — move your card here yourself once you're done developing, and tell
  your pair it's ready for them to test.
- **Done** — your pair (the tester) moves it here once testing passes.

---

## Troubleshooting

**`dev:up` fails or the backend can't find a package after I pulled new changes.**
Someone added a new backend dependency. Just run `npm run dev:up` again — it
rebuilds automatically.

**Frontend can't reach the backend / network errors in the browser console.**
Make sure `npm run dev:up` is actually running and healthy — check with
`docker compose logs -f backend`. The frontend expects the backend at
`http://localhost:2478`.

**I ran `npm run dev:seed` twice and I'm worried I duplicated data.**
Don't worry — every seed file skips anything that already exists (users,
profiles, events, posts, connections, and the Postgres alumni records), it's
safe to re-run anytime.

**A page related to "alumni database" shows an error.**
Make sure `npm run dev:up` includes the `postgres` service (it does by
default) and that you've run `npm run dev:seed` at least once. Check
`docker compose logs -f postgres` and `docker compose logs -f backend` if it
still fails. Real Neon credentials are never needed locally for this.

**First `npm run dev:up` after cloning feels slow.**
Normal — it's building images and installing dependencies for the first time.
Every run after that is fast.

**I'm on Mac and something behaves differently than expected.**
This setup hasn't been extensively tested on Mac yet — tell a senior what you're
seeing so we can fix the guide for the next Mac developer.
