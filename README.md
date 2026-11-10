# Re:Play - My journey through gaming

Archivio personale di tutti i videogiochi giocati: voti, recensioni bilingue (EN/IT) e statistiche.
Lettura pubblica, scrittura riservata al proprietario tramite un CMS integrato.

**Stack:** Next.js (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, Storage) · React Hook Form + Zod · Sonner · Playwright.

## Avvio rapido

1. **Crea un progetto Supabase** (il piano gratuito basta).
2. **Applica lo schema**: esegui in ordine tutti i file di `supabase/migrations/` (SQL editor oppure
   `supabase db push`). Creano tabelle, RLS, bucket `game-media`, funzione di ricerca e viste statistiche.
3. **Disattiva le registrazioni pubbliche**: Authentication → Sign In / Providers → *Allow new users to sign up* off.
4. **Crea il proprietario**: Authentication → Users → *Add user* con email `<username>@re.local` e password
   (auto-confirm). Il primo utente creato diventa `owner`; l'accesso al sito avviene con lo username.
5. **Ambiente**: copia `.env.example` in `.env.local` e compila URL e chiave pubblicabile del progetto.
   La service-role key **non** viene mai usata.
6. `npm install && npm run dev`, poi accedi da `/login`.

## Script

| Comando | |
| --- | --- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione (richiede le variabili Supabase) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Controllo dei tipi |
| `npm run test:e2e` | Test Playwright (contro il Supabase reale) |

## Documentazione

La documentazione completa è in [`docs/`](docs/):

1. [Panoramica](docs/01-panoramica.md): cos'è, funzioni, scelte di prodotto, mappa del repository.
2. [Architettura](docs/02-architettura.md): cache, sicurezza, immagini, filtri, bilinguismo, statistiche.
3. [Database](docs/03-database.md): tabelle, RLS, funzioni, viste, storico migrazioni.
4. [CMS e admin](docs/04-cms-admin.md): pagine, form, server actions, operazioni manuali.
5. [Sviluppo, test e deploy](docs/05-sviluppo-test-deploy.md): variabili, script, Playwright, Vercel.
6. [Cronologia](docs/06-cronologia.md): cosa è stato fatto, problemi incontrati e soluzioni.

## Note rapide di architettura

- **Pagine pubbliche**: client Supabase anonimo senza cookie dentro funzioni `'use cache'`
  (`cacheLife("minutes")`); le server action del CMS invalidano con `updateTag`.
- **Admin** protetto tre volte: `proxy.ts`, `requireOwner()` sul server, Row Level Security (`is_owner()`).
- **Immagini** compresse nel browser e poi sul server con `sharp` (3:4, 900×1200, WebP, blur placeholder).
- **Ricerca, filtri, ordinamento, paginazione** in un'unica funzione SQL, `library_search`, pilotata dall'URL.
- **Statistiche** da viste SQL (`stats_*`), grafici in puro CSS.
