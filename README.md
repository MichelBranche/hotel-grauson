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
| Dati | Prisma 6, SQLite in locale (schema pronto per PostgreSQL) |
| PMS UI | Radix, TanStack Query, dnd-kit, Recharts, react-hook-form, Zod |
| Auth | jose (JWT), bcryptjs |
| Hosting | Vercel, `@vercel/analytics` |

Alias: `@/*` root del sito, `@pms-core/*` modulo PMS.

## Avvio

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

Login demo PMS: `michel.branche@grauson.local` / `Grauson2026!`

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
npm run db:migrate
npm run db:seed
npm run db:studio
npm run db:reset
```

## Ambiente

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="long-random-string"
```

Il deploy Vercel attuale è una demo: sessione con secret di fallback e snapshot SQLite `pms-core/prisma/demo.db` in `/tmp` (le scritture non restano tra le instance). Per produzione: PostgreSQL, `DATABASE_URL` e `AUTH_SECRET` veri.

## Deploy

Stesso progetto Next.js su Vercel (Git su `main`). Una app, un database, un PMS.
