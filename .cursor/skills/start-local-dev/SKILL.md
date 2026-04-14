---
name: start-local-dev
description: Start local backend and frontend development servers for django-vue3-admin, including Python venv setup, backend dependency install, env.py bootstrap, Django migrations and init, frontend pnpm install, and run commands. Use when the user asks to 启动前后端, 本地启动项目, run dev servers, or restart local development environment.
---

# Start Local Dev

## Scope

Use this skill to start local development services for this repository:
- Backend: Django ASGI via `uvicorn` on port `8000`
- Frontend: Vite dev server on port `8080`

## Workflow

1. Verify required files:
   - `backend/requirements.txt`
   - `backend/manage.py`
   - `web/package.json`
2. Ensure backend virtual environment exists at `backend/venv`.
3. Install backend dependencies in that venv.
4. Ensure `backend/conf/env.py` exists:
   - If missing, copy from `backend/conf/env.dev.py`.
5. **Database: run migrations and project init before starting the backend** (requires PostgreSQL/Redis in `env.py` to be reachable).
6. Install frontend dependencies with `pnpm` in `web`.
7. Start backend and frontend as long-running processes.
8. Report URLs and any startup warnings/errors.

## Commands

Run from repo root unless noted.

### Backend setup

```bash
python3 -m venv backend/venv
backend/venv/bin/pip install --upgrade pip
backend/venv/bin/pip install -r backend/requirements.txt
```

### Backend env bootstrap

```bash
test -f backend/conf/env.py || cp backend/conf/env.dev.py backend/conf/env.py
```

### Django migrate and init (before first run or after model changes)

Run from `backend/` with the venv Python. **Do this before `uvicorn`.**

```bash
cd backend
./venv/bin/python manage.py makemigrations
./venv/bin/python manage.py migrate
./venv/bin/python manage.py init
```

Notes:
- `makemigrations`: only needed when models change; safe to run each time.
- `migrate`: applies schema; required before the API works.
- `init`: loads fixtures / default data (roles, menus, etc.); run on a fresh DB or when docs say so. Use `python manage.py init -y` only when intentionally resetting init data (see `dvadmin/system/management/commands/init.py`).

### Frontend setup

```bash
cd web && pnpm install
```

### Start backend

```bash
cd backend
./venv/bin/uvicorn application.asgi:application --host 0.0.0.0 --port 8000
```

### Start frontend

```bash
cd web
pnpm dev
```

## Verification

- Backend expected: `http://127.0.0.1:8000`
- Frontend expected: `http://localhost:8080`
- Frontend API default points to backend (`web/.env.development`: `VITE_API_URL=http://127.0.0.1:8000`)

## Troubleshooting

- If backend fails on DB connection, check `backend/conf/env.py` database/redis values.
- If `pnpm` install fails due to permission/sandbox, rerun with full permissions.
- If port conflict:
  - backend: change `--port 8000`
  - frontend: adjust `VITE_PORT` in `web/.env.development`
