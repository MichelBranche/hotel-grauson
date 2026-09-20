# PMS Core

Modular monolith for a single-property hospitality PMS. In this repository it is the operational system of Hotel Locanda Grauson. It is designed to be copied into another hotel project without rewriting the engine.

## Overview

- One Next.js application
- One Prisma database
- One reservation record
- One availability engine shared by the public booking flow and the reception planning

The public site may import `pms-core`. `pms-core` must never import site-specific components, utilities, or images.

## Architecture

```
Public site  →  Booking engine boundary  ─┐
PMS UI       →  Server actions           ─┼→  Domain services  →  Repositories  →  Database
                                          ┘
```

Layers:

1. UI (`components/`, `app/`)
2. Actions (`actions/`)
3. Domain services (`services/`)
4. Repositories (`database/repositories/`)
5. Prisma (`prisma/`)

Grauson is configuration (`config/property.ts` + the `Property` row), not business logic. There is no `if hotel === "grauson"`.

## Directory

```
pms-core/
  app/                 page implementations
  actions/             server actions
  auth/                session, password, rate limit, guards
  components/          shell, planning, housekeeping, UI
  config/              property, branding, permissions, navigation
  database/            Prisma client + repositories
  integrations/booking-engine/
  modules/             public module barrels
  prisma/              schema + migrations
  seed/
  services/
  styles/pms.css
  types/
```

Next.js route files live in `/app/pms` and `/app/booking`. They are thin wrappers so the App Router can serve the module. Copy those wrappers when you extract the core.

## Database

Prisma + SQLite by default (`DATABASE_URL=file:./dev.db`), so the project stays self-contained without a remote database or Docker.

The schema is written so it can move to PostgreSQL:

1. Change `provider = "postgresql"` in `prisma/schema.prisma`
2. Point `DATABASE_URL` at Postgres
3. Run `npm run db:migrate`

Entities include Organization, Property, User, Room, RoomType, Guest, Reservation, RatePlan, Inventory, Payment, Extra, HousekeepingTask, Notification, AuditLog, and Channel* tables for a future channel manager.

## Authentication

`/pms/login` issues an httpOnly JWT cookie (`pms_session`). `/pms/*` is protected by `proxy.ts` and again in server actions.

Roles: OWNER, ADMIN, MANAGER, RECEPTIONIST, HOUSEKEEPING, READ_ONLY.

Permissions live in `config/permissions.ts`. Do not scatter `if (role === ...)` checks.

Seeded owner:

```
michel.branche@grauson.local
Grauson2026!
```

## Planning

`/pms/planning` is the operational heart: sticky room column, sticky dates, day/week/2-weeks/month, reservation blocks, drawer, move dialog, drag and drop, checkout resize, conflict validation, optimistic UI, server-side undo.

## Availability and booking engine

```ts
import { getAvailability, createReservation, getReservation } from "@pms-core/integrations/booking-engine";
```

The public `/booking` page uses the same functions. There is no second reservation store.

## Security

- Server-side session + permission checks
- Zod validation on mutations
- Password hashing (bcrypt)
- Secure cookies
- Login / public booking rate limits
- Prisma parameterized queries
- Audit log on critical writes

## Development

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `/pms/login` and `/booking`.

Scripts:

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Environment

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="long-random-string"
```

Do not commit secrets.

## Deployment

Deploy as the same Next.js app as the hotel website. The current Vercel deploy is a demonstration: it signs sessions with a fallback `AUTH_SECRET` and copies the committed SQLite snapshot `prisma/demo.db` into `/tmp`. Writes do not persist across instances. When the product is confirmed, switch the Prisma provider to PostgreSQL, set `DATABASE_URL` and `AUTH_SECRET`, and remove the demo fallback. Keep one app, one database, one PMS.

## HOW TO EXTRACT PMS CORE

1. Copy `/pms-core` into the new hotel repository.
2. Copy the thin routes: `app/pms/**`, `app/booking/**`, `proxy.ts`.
3. Copy `public/pms-branding/` (or point branding to new assets).
4. Install the dependencies listed in the root `package.json` (Prisma, Zod, TanStack Query, dnd-kit, date-fns, Recharts, jose, bcryptjs, Radix, etc.).
5. Add the path alias `"@pms-core/*": ["./pms-core/*"]`.
6. Set `DATABASE_URL` and `AUTH_SECRET`.
7. Edit `pms-core/config/property.ts` and `pms-core/config/branding.ts`.
8. Replace `pms-core/branding/sidebar.jpg` and `public/brand/pms/sidebar.jpg`.
9. Adapt `pms-core/seed/index.ts` to the new rooms and rate plans.
10. Run `npm run db:migrate` and `npm run db:seed`.
11. Point the new public site at `getAvailability` / `createReservation`.
12. Start the app and open `/pms/login`.

After extraction the package can be published as `@hospitality/pms-core`. Do not introduce microservices, a second database, or a multi-tenant SaaS layer unless the product actually needs them.
