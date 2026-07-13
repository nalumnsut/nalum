# Developer Setup Guide

Welcome to the team. This guide gets your local development environment running
and explains how we work together as a team. Read it top to bottom once, then use
it as a reference.

## How we work

### Branches

- `main` is the production branch. Nobody pushes to it directly.
- `test` is where all in-progress work lands before it's considered done. All 2nd
  years push their work here — always through a Pull Request, never a direct push.
- For your own work: branch off `main`, name the branch just your name (e.g.
  `<name>`) — keep it short — do your work, then open a PR **into `test`**.
- A 3rd year reviews and approves your PR before it merges into `test`.
- Once merged into `test`, the tester assigned to that piece of work tests it there.

### Working in pairs

You'll be paired with another developer. You're each assigned separate pieces of
work — but you also test *each other's* work once it's ready. When your own task
is done, hand it to your pair to test; when they're done, you test theirs.

### Board (To Do / Testing / Done)

All work is tracked on the team board in three columns:
- **To Do** — a senior assigns work here.
- **Testing** — move your card here yourself once you're done developing, and tell
  your pair it's ready for them to test.
- **Done** — your pair (the tester) moves it here once testing passes.

---

## 1. Prerequisites — install these first

- **Git**
- **Node.js** (LTS, v20 or newer) — needed to run the frontend locally
- **Docker Desktop** (Mac/Windows) or **Docker Engine + Compose plugin** (Linux) —
  needed to run the backend, MongoDB, and Redis

Optional, not required to get started — install later only if you want them:
- **MongoDB Compass** — GUI for browsing the database
- **A Postgres GUI** (e.g. TablePlus, pgAdmin) — only relevant if you're specifically
  assigned Postgres-backed work; see the Postgres section below

## 2. Clone the repo and create your branch

```bash
git clone <repo-url>
cd nalum
git checkout main
git pull
git checkout -b yourname
```
Just your name, nothing else — keeps branch names short.

## 3. Environment files

Two `.env` files are needed, one per app. Copy the example files and fill them in:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`frontend/.env` — the example values already work as-is, no changes needed:
```
VITE_API_URL_DEV=http://localhost:2478
VITE_API_URL_PROD=http://localhost
```

`backend/.env` — fill in as follows:

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

# Leave blank — DEBUG_MAIL=true logs verification/reset links to the console
# instead of actually sending mail, so you don't need real credentials here
BREVO_SMTP_HOST=
BREVO_SMTP_PORT=
BREVO_SMTP_USER=
MAIL_FROM_NAME=
MAIL_FROM_EMAIL=
BREVO_SMTP_PASS=

# See "Postgres" section below before touching this
POSTGRESQL_DATABASE_URL=

# Optional — only needed if you're testing push notifications
# Generate your own: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

Also create a file named `docker-compose.override.yml` in the repo root (same
folder as `docker-compose.yml`) with exactly this content — this is what gives you
hot reload and local database access. Do not commit it; it's already covered by
`.gitignore`.

```yaml
services:
  backend:
    environment:
      FRONTEND_URL: http://localhost:5173
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

volumes:
  mongo_dev_data:
```

## 4. Postgres — read this before asking for a connection string

Postgres is **not part of the local Docker setup** and you do not need a working
connection to get started. Leave `POSTGRESQL_DATABASE_URL` blank — the backend
will start normally without it. The only thing that won't work locally is the
alumni-database admin tooling, which is the one part of the app backed by Postgres.
If you're specifically assigned work that touches that, ask a senior for a
connection string rather than guessing at one.

## 5. Start the backend, MongoDB, and Redis (Docker)

```bash
npm run dev:up
```

This builds and starts the backend (with hot reload), MongoDB, and Redis. Leave it
running in its terminal.

**First time only**, seed some demo data:
```bash
npm run dev:seed
```
This creates 10 alumni (`alumni1@gmail.com`...`alumni10@gmail.com`), 10 students
(`s1@nsut.ac.in`...`s10@nsut.ac.in`), and 1 admin (`devadmin@nsut.ac.in`) — all
with password `12345678`, all pre-verified so you can sign in immediately. It also
adds a handful of sample events, posts, and alumni connections so those pages
aren't empty either.

The seed data lives in `backend/scripts/seed/` — one file per collection
(`users.js`, `profiles.js`, `events.js`, `posts.js`, `connections.js`) plus
`index.js`, which runs them all in order. If you need seed data for a collection
that isn't covered yet, add a new file following the same pattern and wire it into
`index.js`.

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

## 8. Useful, occasional commands

- Start all 4 services including the unused Docker frontend build (only if you
  specifically want to check the production-style build locally):
  `npm run dev:up:all`
- View backend logs: `docker compose logs -f backend`
- Open a MongoDB shell: `docker compose exec mongo mongosh nalum`
- Browse the database with a GUI: connect Compass to `mongodb://localhost:27018/nalum`

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
profiles, events, posts, connections), it's safe to re-run anytime.

**A page related to "alumni database" or admin image tools shows an error.**
Expected — see the Postgres section above. Ask a senior if this blocks your
assigned task.

**First `npm run dev:up` after cloning feels slow.**
Normal — it's building images and installing dependencies for the first time.
Every run after that is fast.

**I'm on Mac and something behaves differently than expected.**
This setup hasn't been extensively tested on Mac yet — tell a senior what you're
seeing so we can fix the guide for the next Mac developer.
