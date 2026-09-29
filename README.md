# Locanda Grauson

![Hero](preview.png)

Sito pubblico della [Locanda Grauson](https://www.locandagrauson.it) (Gimillan di Cogne) e PMS operativo nello stesso applicativo Next.js. Il motore di prenotazione, planning e disponibilità vive in [`pms-core/`](./pms-core/README.md), pensato per essere copiato in un altro hotel senza riscrivere il dominio.

**Live:** [locandagrauson.it](https://www.locandagrauson.it)

## Cosa fa

### Sito pubblico

- Home, camere (elenco + scheda), ristorante, Cogne, contatti, privacy
- Hero cinematografici, transizioni di pagina, scroll Lenis, GSAP / ScrollTrigger
- Stagioni (estate, autunno, inverno) e demo effetti Natalizi: fotografia e accenti cambiano senza ricaricare
- Motore di prenotazione su `/booking`, stesso database del PMS
- SEO: metadata, sitemap, robots, Open Graph, JSON-LD Hotel / WebSite
- Immagini AVIF/WebP via `next/image`, font locali (Sora) e `next/font`

### PMS (`/pms`)

- Dashboard, planning drag-and-drop, prenotazioni, camere e tipologie
- Ospiti, tariffe, disponibilità, housekeeping, pagamenti, report
- Booking engine e canali OTA (struttura pronta)
- Ruoli (OWNER → READ_ONLY), JWT httpOnly, audit log, rate limit sul login
- Una sola disponibilità per reception e sito pubblico

Dettaglio architettura, estrazione e schema: [`pms-core/README.md`](./pms-core/README.md).

## Tech stack

| Area | Scelte |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| Stile | Tailwind CSS 4, CSS tokens di marca |
| Motion | GSAP + `@gsap/react`, Lenis |
| Dati | Prisma 6, PostgreSQL su Supabase |
| PMS UI | Radix, TanStack Query, dnd-kit, Recharts, react-hook-form, Zod |
| Auth | jose (JWT), bcryptjs |
| Hosting | Vercel, `@vercel/analytics` |

Alias: `@/*` root del sito, `@pms-core/*` modulo PMS.

## Avvio

```bash
cp .env.example .env
```

In `.env` (solo in locale, non va committato) imposta `DATABASE_URL` con la session URI Postgres di Supabase e un `AUTH_SECRET` lungo e casuale. Per il primo seed imposta anche `SEED_OWNER_PASSWORD` (password temporanea, da cambiare dopo il primo accesso).

```bash
npm install
npm run db:generate
npx prisma migrate deploy --schema pms-core/prisma/schema.prisma
npm run db:seed
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Il login PMS usa l'email e la password definite in `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`. La password non è nel repository.

## Route

| Percorso | Contenuto |
| --- | --- |
| `/` `/camere` `/ristorante` `/cogne` `/contatti` | Sito |
| `/booking` | Prenotazione pubblica |
| `/pms/login` | Accesso reception |
| `/pms` `/pms/planning` … | Console PMS |

## Script

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run db:seed:demo
npm run db:studio
```

`npm run db:seed` crea l'organizzazione, la property e un solo utente OWNER. Camere, tariffe e prenotazioni restano vuote. `npm run db:seed:demo` sostituisce i dati con un dataset fittizio ed è solo per uso locale.

`npm run db:migrate` (`prisma migrate dev`) serve alle modifiche successive dello schema. Il primo allineamento su Supabase è `migrate deploy`: la migration `init_postgres` è già nel repo e Supabase non ospita lo shadow database di Prisma. Non eseguire `npm run db:reset` sul progetto Supabase: cancella i dati.

## Ambiente

```
DATABASE_URL="postgresql://postgres:PASSWORD@db.wmtuojolspyidnhhyruc.supabase.co:5432/postgres"
AUTH_SECRET="long-random-string"
SEED_OWNER_EMAIL="owner@grauson.local"
SEED_OWNER_PASSWORD="set-a-temporary-password"
```

Database locale e di produzione: Postgres su Supabase (progetto `hotel-grauson`, region `eu-west-2`). Una sola `DATABASE_URL` sulla porta 5432 (connessione diretta): Prisma non richiede `DIRECT_URL`. Sostituisci `PASSWORD` nel `.env` locale. Non committare `.env`.

Su Vercel imposta le stesse variabili `DATABASE_URL` e `AUTH_SECRET`, senza valori di esempio. Se il runtime non raggiunge l'host diretto `db.<ref>.supabase.co` (spesso solo IPv6), usa al suo posto la session URI del pooler Supavisor, sempre sulla porta 5432, sempre in `DATABASE_URL`. Il pooler in transaction mode (porta 6543) non è configurato qui.

## Deploy

Stesso progetto Next.js su Vercel (Git su `main`). Una app, un database, un PMS.
