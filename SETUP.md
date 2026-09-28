# Developer Setup Guide

Welcome to the team. This guide gets your local development environment running
and explains how we work together as a team. Read it top to bottom once, then use
it as a reference.

## How we work

### Branch model

Everyone — Developers and Maintainers alike — works directly in this repo (`https://github.com/nalumnsut/nalum`). There are no forks anymore; access is controlled by GitHub team instead: 

- **Maintainers** (the 3rd yr seniors) — can review, approve, and merge into `main` and `ctest`. 
- **Developers** (all 2nd yr juniors) — can push freely to their own branches, but cannot push or merge directly into `main` or `ctest`. Both are protected branches that only accept changes through an approved Pull Request, merged by a Maintainer — this is enforced by GitHub, not just a rule to remember. 

Branches: 

- `main` is the production branch.
- `ctest` is where all in-progress work lands and gets checked before it's considered done. (`test` has been retired and deleted — `ctest` replaces it.)
- You do your own work on **your own branch**, created off the latest `ctest` — never off `main`, and never by committing straight to `ctest` yourself. Suggested naming: `<yourname>` (e.g. `priya`)
- When a piece of work is ready, push your branch and tell your assigned senior it's done — **don't open a PR yet**. Only once they give you a thumbs up do you open the Pull Request, **from your branch into `ctest`** — never into `main`. 
- Your senior reviews the PR by looking at your branch's diff directly (that's what the PR shows), then approves and merges it into `ctest`. You cannot merge your own PR — GitHub blocks that regardless of write access. 
- There are 3 Maintainers, each responsible for their own group of Developers — send your PR to the senior who owns your piece of work. 
- Once every group's assigned work for the round has landed in `ctest` and it's been checked there, a Maintainer merges `ctest` into `main`. 

Before starting **any** new piece of work, sync your local `ctest` with the remote first — see "2. Clone the repo and create your branch" below.

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

## 2. Clone the repo and create your branch 

1. Clone the repo directly — no fork needed: 

   ```bash
   git clone https://github.com/nalumnsut/nalum.git
   cd nalum
   ```

2. Check out `ctest` and make sure it's up to date. Do this every time you're about to start a new piece of work, not just the first time: 

   ```bash
   git checkout ctest
   git pull origin ctest
   ```

3. Create your own branch off `ctest` for the piece of work you've been assigned: 

   ```bash
   git checkout -b <yourname>
   ```

4. Push it so it exists on GitHub and you can open a PR from it later:

   ```bash
   git push -u origin <yourname> 
   ```

Do your work on this branch, committing and pushing as you go (plain `git push` from now on, since `-u` set the upstream). When it's ready, open a PR from your branch into `ctest` — see "Branch model" above, and  "9. Review and merge, in practice" below for the full flow. 

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

## 8. Review and merge, in practice 

### Opening your PR 
When your branch is ready: 

```bash 
git push 
``` 

Tell your assigned senior it's done and wait for their thumbs up — **don't open the PR before that**. Once they've given the go-ahead, open a Pull Request on GitHub with **base: `ctest`**, **compare: your branch**. 
Double-check the base branch before submitting — a PR opened against `main` by mistake won't go anywhere, since only Maintainers can merge there, and only for the whole-group `ctest` → `main` promotion, not individual work.    

### The `ctest` → `main` promotion  

This part isn't something individual Developers do. Once all 3 groups' work for the round is merged into `ctest`, the Maintainers check it together and, once satisfied, one of them merges `ctest` into `main`. 
If you're waiting on something reaching production, check with a senior on the status of that round rather than assuming your own PR landing in `ctest` is the last step. 

--- 

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
- Need to keep notes, plans, or scratch files for your own use? Make a `docs/` folder at the repo root rather than leaving loose files there.
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

---

## PR Database Isolation

Every Pull Request automatically gets its own isolated MongoDB database
(`nalum_pr_<PR_NUMBER>`), managed by GitHub Actions. The database is created and
seeded when the PR is opened, reused across commits, and dropped when the PR is
closed or merged.

For full details — including required secrets, MongoDB Atlas setup, how seeding
works, and how to troubleshoot — see
[docs/PR_DATABASE_ISOLATION.md](docs/PR_DATABASE_ISOLATION.md).
