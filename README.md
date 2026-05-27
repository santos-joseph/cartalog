# Cartalog

SaaS multi-tenant para catalogação de veículos.

## Stack

- **Backend:** Node.js + TypeScript + Fastify + Prisma + PostgreSQL
- **Frontend:** Next.js + TypeScript + TailwindCSS + React Query + Zustand

## Quick Start

```bash
# 1. Start the database
docker compose up -d

# 2. Start the API
cd api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Start the frontend
cd ../web
cp .env.example .env.local
npm install
npm run dev
```

## URLs

- API: http://localhost:3333
- Docs: http://localhost:3333/docs
- Frontend: http://localhost:3000
- Prisma Studio: `cd api && npx prisma studio`
