# Clip Knowledge App (ERD-based Starter)

This is a TypeScript + Express + Prisma starter implementing your data model and core APIs for:
- Clip ingestion and processing records
- Tags and notes
- Extracted entities
- Collections: wishlist, reading list, quote cards, flashcards
- Routines and routine items

## Stack
- Node.js + TypeScript
- Express API
- PostgreSQL
- Prisma ORM

## Quick Start

1. Copy env file
```bash
cp .env.example .env
```

2. Start Postgres
```bash
docker compose up -d
```

3. Install deps
```bash
npm install
```

4. Generate Prisma client + migrate DB
```bash
npm run db:generate
npm run db:migrate -- --name init
```

5. Optional seed
```bash
npm run db:seed
```

6. Run API
```bash
npm run dev
```

API base: `http://localhost:3000`

## Endpoints

### Health
- `GET /health`

### Users
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `GET /users/:id/dashboard`

### Clips
- `POST /clips`
- `GET /clips?userId=<uuid>&status=READY`
- `GET /clips/:id`
- `PATCH /clips/:id`
- `POST /clips/:id/notes`
- `POST /clips/:id/entities`
- `POST /clips/:id/tags/:tagId`

### Tags
- `POST /tags`
- `GET /tags?userId=<uuid>`
- `PATCH /tags/:id`

### Entities
- `GET /entities?clipId=<uuid>&entityType=CONCEPT`

### Collections
- `POST /collections/wishlist`
- `POST /collections/reading`
- `POST /collections/quotes`
- `POST /collections/flashcards`
- `GET /collections/:type?userId=<uuid>` where `type` in `wishlist|reading|quotes|flashcards`

### Routines
- `POST /routines`
- `GET /routines?userId=<uuid>`
- `POST /routines/:id/items`
- `PATCH /routines/items/:id`

## Notes
- Prisma models map directly to your uppercase table names via `@@map`.
- Domain guards are enforced in API layer (e.g., wishlist requires PRODUCT entity).
- Add auth middleware and row-level access control before production use.
