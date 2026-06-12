# AppSec Report Builder

AppSec Report Builder is a private application for creating and reviewing application security reports.

The project is still actively being developed, so the feature set and structure will continue to evolve.

## Requirements

- Node.js `24.15.0`
- npm bundled with that Node release

## Local Database Setup

The project now includes a minimal Prisma + SQLite foundation for local development.

1. Install dependencies with `npm install`.
2. Create a local `.env` file from `.env.example` and keep `DATABASE_URL="file:./dev.db"` there.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply the development migration with `npm run db:migrate`.
5. Validate the schema with `npm run db:validate`.
6. Open Prisma Studio with `npm run db:studio`.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the
rules for submitting patches and the expected `Signed-off-by:` flow.

## License

This project is licensed for private, non-commercial use only. See
[LICENSE](./LICENSE) for the full text.
