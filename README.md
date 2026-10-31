# Health System Backend

NestJS + GraphQL + Prisma (Postgres) + Redis backend for the health system PoC (patients, hospitals, doctors, pharmacies, wallets).

## Docs
- [docs/PRD.md](docs/PRD.md) — product requirements
- [docs/schema.graphql](docs/schema.graphql) — GraphQL API contract (source of truth for frontend)
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md) — screen-by-screen integration guide for frontend
- [PHASES.md](PHASES.md) — build phases / roadmap
- [.cursor/rules/architecture.mdc](.cursor/rules/architecture.mdc) — module/file structure conventions

## Setup

```bash
yarn install
cp .env.example .env   # adjust DATABASE_URL / REDIS_URL if not using the defaults
npx prisma migrate dev
yarn start:dev
```

Requires a reachable Postgres and Redis (see `.env.example` for connection strings — defaults assume local instances on the standard ports).

GraphQL Playground: `http://localhost:3000/graphql`
