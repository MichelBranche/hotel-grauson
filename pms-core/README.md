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

Prisma + Supabase Postgres. `DATABASE_URL` is the direct session URI on port 5432 (`db.<project-ref>.supabase.co`). The schema does not use `DIRECT_URL`.

```bash
npm run db:generate
npx prisma migrate deploy --schema pms-core/prisma/schema.prisma
npm run db:seed
```

`npm run db:seed` upserts the organization, the property, and one OWNER user. Rooms, rates, guests, and bookings stay empty. `npm run db:seed:demo` loads a fictional local dataset and must not run in production.

The Postgres baseline is `pms-core/prisma/migrations/*_init_postgres`. The old SQLite history is archived in `pms-core/prisma/migrations_sqlite_backup` and is not applied.

Entities include Organization, Property, User, Room, RoomType, Guest, Reservation, RatePlan, Inventory, Payment, Extra, HousekeepingTask, Notification, AuditLog, and Channel* tables for a future channel manager. Row Level Security is enabled on those tables with no Data API policies: the app talks to Postgres through Prisma, not through the Supabase Data API.

## Authentication

`/pms/login` issues an httpOnly JWT cookie (`pms_session`). `/pms/*` is protected by `proxy.ts` and again in server actions.

Roles: OWNER, ADMIN, MANAGER, RECEPTIONIST, HOUSEKEEPING, READ_ONLY.

Permissions live in `config/permissions.ts`. Do not scatter `if (role === ...)` checks.

The clean seed creates one OWNER. Set `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` in `.env` before the first `npm run db:seed`. Change the password after the first login. The password is not printed and is not stored in the repo.

## Planning

`/pms/planning` is the operational heart: sticky room column, sticky dates, day/week/2-weeks/month, reservation blocks, drawer, move dialog, drag and drop, checkout resize, conflict validation, optimistic UI, server-side undo.

## Availability and booking engine

```ts
import { getAvailability, createReservation, getReservation } from "@pms-core/integrations/booking-engine";
```

The public `/booking` page uses the same functions. There is no second reservation store.

## Rates, seasons and closures

Reception edits everything in `/pms/rates` (rate plans, base prices per room type, seasons, 21-day calendar) and `/pms/availability` (search with refusal reasons, closures). Search, PMS reservation creation and `/booking` all go through `lib/pricing.ts` (pure, tested in `lib/pricing.test.ts`) via `services/pricing.service.ts`.

Nightly price for a room type, rate plan and night, first match wins:

1. Day override (`Rate.price` for that plan, type and date)
2. Season price for the room type (`RateSeasonPrice`)
3. Rate plan base price (`RatePlanPrice`)
4. Room type base price, if above 0
5. Otherwise the plan is not offered for that stay

Restrictions for a stay combine every night: minimum stay is the highest of the plan, the season and `Inventory.minStay`; maximum stay is the lowest. A season marked closed-to-arrival refuses check-in on its nights and closed-to-departure refuses check-out on its days. `Inventory.closed` closes the whole room type for that night, `Rate.closed` closes one plan, and a `RoomBlock` removes one physical room from sale and from the planning board.

Seasons cover nights: start and end are both nights, end inclusive. Overlap policy: a night belongs to at most one season per rate plan, and a season for "all plans" cannot share nights with any other season. The service rejects overlaps on create and edit. Editing or deleting a season never reprices existing reservations; they keep the total stored at booking.

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
npx prisma migrate deploy --schema pms-core/prisma/schema.prisma
npm run db:seed
npm run dev
```

Open `/pms/login` and `/booking`.

Scripts:

- `npm run db:generate`
- `npm run db:migrate:deploy` — apply committed migrations (use this against Supabase)
- `npm run db:migrate` — `prisma migrate dev` for later schema changes
- `npm run db:seed` — organization, property, one owner
- `npm run db:seed:demo` — local fictional data only
- `npm run db:studio`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Environment

```
DATABASE_URL="postgresql://postgres:PASSWORD@db.<project-ref>.supabase.co:5432/postgres"
AUTH_SECRET="long-random-string"
SEED_OWNER_PASSWORD="set-a-temporary-password"
```

Do not commit `.env` or passwords. `AUTH_SECRET` is required; there is no demo fallback.

## Deployment

Deploy as the same Next.js app as the hotel website. Set `DATABASE_URL` and `AUTH_SECRET` on Vercel. Keep one app, one Postgres database, one PMS. Do not point production at a SQLite file.

## HOW TO EXTRACT PMS CORE

1. Copy `/pms-core` into the new hotel repository.
2. Copy the thin routes: `app/pms/**`, `app/booking/**`, `proxy.ts`.
3. Copy `public/pms-branding/` (or point branding to new assets).
4. Install the dependencies listed in the root `package.json` (Prisma, Zod, TanStack Query, dnd-kit, date-fns, Recharts, jose, bcryptjs, Radix, etc.).
5. Add the path alias `"@pms-core/*": ["./pms-core/*"]`.
6. Set `DATABASE_URL` and `AUTH_SECRET`.
7. Edit `pms-core/config/property.ts` and `pms-core/config/branding.ts`.
8. Replace `pms-core/branding/sidebar.jpg` and `public/brand/pms/sidebar.jpg`.
9. Adapt `pms-core/seed/index.ts` (clean owner seed) or `pms-core/seed/demo.ts` (local fictional data) to the new property.
10. Run `npx prisma migrate deploy --schema pms-core/prisma/schema.prisma` and `npm run db:seed`.
11. Point the new public site at `getAvailability` / `createReservation`.
12. Start the app and open `/pms/login`.

After extraction the package can be published as `@hospitality/pms-core`. Do not introduce microservices, a second database, or a multi-tenant SaaS layer unless the product actually needs them.
