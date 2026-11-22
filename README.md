# FileShare Vault

Solo vault for **files**, **links**, and **credentials** with folders and public/private sharing.

## Stack

- **web** — Next.js (App Router) + TypeScript
- **api** — NestJS + Prisma + JWT auth
- **db** — PostgreSQL (Docker)

## Features

- **Public library** (`/`) — browse public files/folders/links with no login
- **Private vault** (`/vault`) — manage everything after sign-in
- Email/password authentication
- Nested folders
- Upload files, save links, store credentials
- Credentials encrypted at rest (AES-256-GCM)
- Private by default; mark folder/item public to list it and share a link

## Quick start

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. API

```bash
cd api
cp .env.example .env   # already created for local use
npx prisma migrate dev
npm run start:dev
```

API: http://localhost:4000/api

### 3. Web

```bash
cd web
# NEXT_PUBLIC_API_URL=http://localhost:4000/api in .env.local
npm run dev
```

App: http://localhost:3000

## Env notes

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | api | Postgres connection |
| `JWT_SECRET` | api | JWT signing |
| `ENCRYPTION_KEY` | api | 64 hex chars (32 bytes) for credential encryption |
| `CORS_ORIGIN` | api | Frontend origin |
| `NEXT_PUBLIC_API_URL` | web | API base URL |

Change `JWT_SECRET` and `ENCRYPTION_KEY` before any real use.

## Share URLs

- Folder: `/share/folder/<token>`
- Item: `/share/item/<token>`
