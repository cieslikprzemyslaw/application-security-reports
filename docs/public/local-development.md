# Local development

## Requirements

- Node.js `24.15.0`
- npm
- Git

The package requires Node `>=24 <25`.

## Environment

Create `.env` from the tracked example:

```powershell
Copy-Item .env.example .env
```

Environment variables:

| Variable          | Required | Default                 | Purpose                                |
| ----------------- | -------- | ----------------------- | -------------------------------------- |
| `DATABASE_URL`    | yes      | none                    | Prisma SQLite connection URL           |
| `API_PORT`        | no       | `3001`                  | Express listen port                    |
| `PORT`            | no       | none                    | Fallback for `API_PORT`                |
| `FRONTEND_ORIGIN` | no       | `http://localhost:5173` | Allowed browser origin for local CORS  |
| `NODE_ENV`        | no       | `development`           | `development`, `test`, or `production` |

The example database URL is:

```dotenv
DATABASE_URL="file:./dev.db"
```

Do not commit `.env`, database files, uploads, logs, credentials, or customer data.

## Install and initialise

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Run both processes

```powershell
npm run dev
```

This starts:

- Vite on `http://localhost:5173`
- Express on `http://localhost:3001`

The Vite development server proxies `/api` and `/uploads` to the API process.

## Run processes separately

```powershell
npm run dev:client
npm run api:dev
```

## Database commands

```powershell
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Reset the database:

```powershell
npm run db:reset
```

`db:reset` deletes current local data, reapplies migrations, and runs the seed script.

## Build and preview

```powershell
npm run build
npm run preview
```

The compiled API entry point is started with:

```powershell
npm run api:start
```

Run `npm run build` before `npm run api:start`.

## Common checks

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The aggregate validation command is:

```powershell
npm run validate
```

See [Testing](testing.md) for focused suites and temporary-database behaviour.
