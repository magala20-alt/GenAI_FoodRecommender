# Backend Setup

This backend uses FastAPI, SQLAlchemy, JWT auth, and PostgreSQL.

## What is implemented

- Clinician login for the web app
- Patient login for the mobile app
- Current user lookup
- Profile update
- Patient onboarding completion
- Demo seed users for local development

## Default admin account

The backend now seeds a single admin account (and removes old demo users):

- Admin: `admin@caresync.com` / `Admin@12345`

You can override these credentials in `.env`:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FIRST_NAME`
- `ADMIN_LAST_NAME`

## Run locally

1. Create and activate a virtual environment.
2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and set `DATABASE_URL`.
4. Start PostgreSQL and create the database:

```sql
CREATE DATABASE caresync;
```

5. Run the API:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. Open the docs at `http://localhost:8000/docs`.

## PostgreSQL connection notes

Use this connection string format:

```text
postgresql+psycopg://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
```

Example:

```text
postgresql+psycopg://postgres:postgres@localhost:5432/caresync
```

If you want a quick local server with Docker:

```powershell
docker run --name caresync-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=caresync -p 5432:5432 -d postgres:16
```

## Frontend connection

- Web app default base URL: `http://localhost:8000/api`
- Mobile app base URL: set the IP in `GenAI_FoodRecommender/app/config.ts` to your machine's LAN IP when testing on a real device

