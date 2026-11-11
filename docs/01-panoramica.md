# Re:Play - Panoramica

**Re:Play** ("My journey through gaming") è l'archivio personale di Salvatore (username `Heavxn`) di tutti i
videogiochi giocati: valutazioni, recensioni bilingue (inglese e italiano) e statistiche. Il sito è
**pubblico in sola lettura** per chi lo visita; **solo il proprietario** può scrivere, tramite un CMS
integrato sotto `/admin`.

## Stack

| Area | Scelta |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19 |
| Linguaggio | TypeScript |
| Stile | Tailwind CSS v4, shadcn/ui (stile `base-nova`, basato su `@base-ui/react`) |
| Backend | Supabase: Postgres, Auth, Storage |
| Form e validazione | React Hook Form + Zod 4 |
| Notifiche | Sonner |
| Immagini | `sharp` (server) + canvas del browser (client), `next/image` |
| Test | Playwright (desktop, mobile, tablet) |
| Hosting | Vercel (deploy automatico a ogni push su `master`) |

> Questa versione di Next.js ha differenze rispetto a quella "classica" (vedi `AGENTS.md`): prima di toccare
> API o convenzioni, leggere le guide in `node_modules/next/dist/docs/`.

## Cosa fa il sito

### Parte pubblica

- **Overview** (`/`): numeri chiave (giochi, completati, recensiti, voto medio), gioco in evidenza e scaffali
  "Recently added", "Latest reviews" e "Highest rated". Non c'è più "Playing now": i giochi si aggiungono
  quando sono finiti.
- **Library** (`/library`): tutti i giochi in vista griglia o lista, con ricerca, filtri combinabili
  (genere, piattaforma, anno, stato, completamento, voto, tipo solo/online), ordinamenti e paginazione.
  Filtri e ordinamento vivono nell'URL, quindi ogni vista è condivisibile.
- **Gioco** (`/games/[slug]`): scheda con copertina, metadati, voto, pro e contro e recensione in inglese e
  italiano (tab EN/IT).
- **Reviews** (`/reviews`): solo i giochi recensiti, con anteprima e selezione lingua (`?lang=it`).
- **Statistics** (`/statistics`): totali, generi, piattaforme, distribuzione dei voti, giochi per anno.
- **About** (`/about`): presentazione personale in italiano e inglese, riquadro "In breve" e link al
  profilo Steam (presente anche nel footer).
- **404** dedicate (sito e admin) che mantengono header e footer.

### Parte privata (`/admin`)

Accesso con username e password su `/login`. Elenco giochi con ricerca e filtri, creazione, modifica ed
eliminazione, upload della copertina, creazione al volo di generi, piattaforme e tag. Dettagli in
[04-cms-admin.md](04-cms-admin.md).

## Scelte di prodotto principali

- **Giochi online/competitivi dentro la libreria**, distinti da un badge "Online" e da un filtro "Type"
  (solo/online), invece di una sezione separata: restano nelle statistiche e nelle ricerche comuni.
- **Recensioni bilingue obbligatorie a coppia**: o ci sono entrambe (EN e IT) o nessuna, imposto sia dalla
  validazione (Zod) sia da un vincolo del database.
- **Niente date di inizio/recensione, note personali, screenshot e artwork**: rimossi su richiesta per
  tenere il modello semplice. Resta la sola data di completamento (opzionale).
- **Nelle card** compare "anno · sviluppatore" invece della piattaforma.
- **Identità visiva**: tema scuro monocromatico, logo "Re:Play" (`public/brand/replay-logo.png`) da `md` in su,
  testo "Re" sotto, favicon a triangolo "play" (`src/app/icon.svg`).
- **Un solo amministratore**: il primo utente creato in Supabase diventa `owner`; le registrazioni pubbliche
  vanno disattivate.

## Mappa del repository

```
src/app/(site)/        pagine pubbliche (overview, library, game, reviews, statistics, about, 404)
src/app/admin/         CMS: pagine e server actions (actions.ts)
src/app/login/         pagina di login e relativa action
src/proxy.ts           aggiorna la sessione Supabase e protegge /admin
src/components/        about, admin, games, layout, stats, ui (shadcn)
src/content/about.ts   testi della pagina About (EN/IT) e URL Steam
src/lib/               auth, dati (public/admin), immagini, validazione, tipi, parsing URL
src/hooks/             useQueryParams, useDebouncedValue
supabase/migrations/   schema e modifiche (applicate in ordine)
tests/                 suite Playwright
docs/                  questa documentazione
```
