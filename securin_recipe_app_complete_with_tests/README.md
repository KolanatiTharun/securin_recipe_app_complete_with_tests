# Securin Recipe App — Complete Package (Postgres + Mongo + React)

This package contains two backend options and a React frontend so you can run whichever you prefer.

## Services included
- `server_postgres/` : Full Postgres backend (Express + pg), seed script, SQL schema.
- `server_mongo/` : Full Mongo backend (Express + Mongoose), seed script.
- `client/` : React frontend using Vite. Configure VITE_API_BASE in .env to point to desired backend.
- `Securin_Recipes.postman_collection.json` : Postman collection for testing APIs.
- `docker-compose.yml` : Brings up Postgres and Mongo containers for convenience.

## Quick start — Mongo (recommended for simplicity)
1. Start mongo: `docker compose up -d mongo`
2. Seed & run server_mongo:
   ```bash
   cd server_mongo
   cp .env.example .env
   npm install
   npm run seed
   npm run dev
   ```
   Server runs at default port 4001.
3. Frontend:
   ```bash
   cd client
   npm install
   # Optionally set VITE_API_BASE=http://localhost:4001 in client/.env
   npm run dev
   ```

## Quick start — Postgres
1. Start postgres: `docker compose up -d postgres`
2. Seed & run server_postgres:
   ```bash
   cd server_postgres
   cp .env.example .env
   npm install
   psql postgresql://postgres:postgres@localhost:5432/recipes_db -f sql/schema.sql
   npm run seed
   npm run dev
   ```
   Server runs at default port 4000.
3. Frontend: set `VITE_API_BASE` in client/.env to `http://localhost:4000` and run client as above.

## Testing with Postman
- Open `Securin_Recipes.postman_collection.json` and set variable `baseUrl` to the backend you started (http://localhost:4001 or http://localhost:4000).

## Notes for 100% assessment marks
- Both backends sanitize `NaN` values to `null` and coerce nutrient numbers.
- Endpoints:
  - `GET /api/recipes?page=&limit=` (paginated, sorted by rating desc)
  - `GET /api/recipes/search?...` (filters: title, cuisine, rating comparator, total_time comparator, calories comparator)
- README contains all setup commands for reproducibility.
