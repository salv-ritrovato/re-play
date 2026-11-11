# Architettura

## Rendering e cache (Next.js 16, Cache Components)

- Le letture pubbliche sono funzioni `'use cache'` in `src/lib/data/public.ts`, con `cacheLife("minutes")`
  e `cacheTag` (`games`, `taxonomy`, `game:<slug>`). Si usano durate brevi perché una cache da un'ora è
  risultata troppo lunga.
- Le letture dell'admin (`src/lib/data/admin.ts`) **non** sono in cache: usano la sessione dell'utente.
- Le pagine che dipendono da `searchParams`, `params` o cookie (library, reviews, gioco, admin) avvolgono la
  parte dinamica in `<Suspense>`, come richiesto da Cache Components.
- Le server action dell'admin chiamano `updateTag` (helper `invalidate()` in `src/app/admin/actions.ts`) così
  le modifiche compaiono subito. `createTaxonomy` **non** invalida di proposito (vedi cronologia).
- `connection()` è chiamato in `createClient()` e in `AdminShell` per evitare errori di prerender dovuti a
  `Date.now()`/`new Date()`.
- `src/proxy.ts` (al posto del vecchio middleware) aggiorna i cookie di sessione Supabase e reindirizza
  `/admin` → `/login?next=…` se non autenticati, e `/login` → `/admin` se già autenticati.
- Next mantiene lo stato delle pagine già visitate (Activity): i form vanno quindi resettati esplicitamente.

## Autenticazione e sicurezza (tre livelli)

1. **`proxy.ts`**: redirect ottimistico (valida il JWT con `auth.getUser()`).
2. **`requireOwner()` / `assertOwner()`** (`src/lib/auth.ts`): controllano sul server utente e ruolo `owner` in
   `profiles`. `requireOwner` reindirizza (pagine), `assertOwner` lancia (server action).
3. **Row Level Security** in Postgres: lettura pubblica, scrittura solo con `is_owner()`.

Altri punti:

- **Login per username**: l'username viene mappato a `<username>@re.local` (utente creato in Supabase Auth).
- Il primo utente creato diventa `owner` (trigger `handle_new_user`). Le registrazioni pubbliche vanno
  disattivate in Supabase (Authentication → Sign In / Providers → *Allow new users to sign up*).
- Si usa solo la **chiave pubblicabile** (anon): la service-role key non è mai usata dall'app.
- Due client Supabase: uno **senza cookie** (`src/lib/supabase/public.ts`) per le letture pubbliche in cache,
  uno **di sessione** (`@supabase/ssr`, `src/lib/supabase/server.ts`) per l'admin.
- Il bucket `game-media` è pubblico in lettura, accetta solo `image/webp` (max 5 MB) e permette scritture
  solo al proprietario.

## Immagini (copertine)

Le copertine sono compresse **due volte**:

1. **Browser** (`src/lib/client-image.ts`): ridimensionamento e conversione WebP su canvas prima dell'upload,
   per non inviare file enormi.
2. **Server** (`src/lib/images.ts`, `sharp`): rotazione EXIF, rimozione metadati, ritaglio 3:4 a
   900×1200, WebP qualità 80, e calcolo di un **blur placeholder** salvato in `games.cover_blur`.

In lettura, `next/image` serve AVIF/WebP alla dimensione giusta (`qualities` 60/75/85, `remotePatterns`
verso Supabase). Le server action accettano body fino a 12 MB (`serverActions.bodySizeLimit`).

## Ricerca, filtri, ordinamento, paginazione

- Tutto passa da **un'unica funzione SQL**, `library_search` (vedi [03-database.md](03-database.md)),
  pilotata dai parametri URL.
- `parseLibraryParams` (`src/lib/library-params.ts`) è difensivo: UUID non validi, numeri non numerici,
  ordinamenti sconosciuti o pagine negative vengono ignorati senza errori.
- `useQueryParams` (`src/hooks/use-query-params.ts`) tiene l'ultima query in un `ref` per non perdere
  aggiornamenti in caso di click ravvicinati sui filtri.
- La pagina Reviews usa gli stessi parametri con opzioni di ordinamento dedicate (`REVIEW_SORT_OPTIONS`).

## Pagine degli sviluppatori

- Il campo `developer` è testo libero e spesso elenca più studi separati da virgola o punto e virgola.
  `splitDevelopers` (`src/lib/developers.ts`) lo scompone in nomi singoli (senza doppioni; "Inc.", "Ltd" e
  simili restano attaccati al nome che li precede) e `developerHref` costruisce l'indirizzo
  `/developers/<slug>`, dove lo slug è `slugify(nome)`.
- `getDeveloperGames(slug)` (`src/lib/data/public.ts`, in cache e con tag `games`) cerca tra i valori distinti
  di `filter_developers` il nome che corrisponde allo slug, poi legge i giochi con `ilike` e tiene solo
  quelli in cui quel nome è davvero uno degli studi. Nessuna modifica al database. Se non trova nulla, la
  pagina mostra il 404 del sito.
- **Card cliccabili con link dentro.** Un link non può stare dentro un altro link, quindi in `GameCard`,
  `GameRow` e nel gioco in evidenza della home il link del titolo è "esteso" su tutta la card
  (`after:absolute after:inset-0`) e i nomi degli sviluppatori (`DeveloperLinks`) stanno sopra con
  `relative z-10`. Cliccare ovunque sulla card apre il gioco, cliccare un nome apre lo sviluppatore.

## Recensioni bilingue

- Colonne `review_en` e `review_it`; vincolo "entrambe o nessuna" nel database e `refine` nello schema Zod.
- `ReviewTabs` (scheda gioco) e selezione `?lang=it` (pagina Reviews); helper `reviewFor` in `src/lib/types.ts`.

## Statistiche

Calcolate da **viste SQL** (`stats_*`) sui dati reali. I grafici (`src/components/stats/charts.tsx`) sono in
puro CSS, senza JavaScript client: `BarList` (barre orizzontali) e `Columns` (colonne verticali). Le colonne
scorrono in orizzontale solo se non c'è spazio (schermi stretti), mai in verticale, e senza barra di
scorrimento visibile.

## Pagina About

I testi stanno in `src/content/about.ts` (un oggetto per lingua: titolo, introduzione, sezioni, chiusura,
riquadro "In breve", link Steam). `AboutView` (client) gestisce il cambio EN/IT; entrambe le versioni sono
incluse nella pagina. Per cambiare testi o aggiungere giochi alla lista basta modificare quel file; l'URL del
profilo Steam è la costante `STEAM_URL`.

## UI

- **Icone** (`lucide-react`): piccole e sobrie, mai più di una per riga. `IconLabel`
  (`src/components/ui/icon-label.tsx`) mette un'icona decorativa (`aria-hidden`) davanti a un'etichetta e ne
  eredita il colore. Sono usate nei numeri di home e Statistics, nei dettagli e nei dati principali della
  scheda del gioco, nel badge "Online" (Wifi), negli stati vuoti (`EmptyState` accetta `icon`), nelle pagine
  di errore e 404 e nel riquadro "In breve" di About (ogni voce ha una chiave `icon` in `about.ts`, tradotta
  in icona da `about-view.tsx`). Menu principale e footer restano senza icone, di proposito.
- **Launcher** (Steam, Ubisoft Connect, EA app, Battle.net): ogni gioco può avere zero o più launcher
  (`games.launchers`). L'elenco è la costante `LAUNCHERS` in `src/lib/types.ts`: per aggiungerne uno basta
  inserirlo lì e aggiungere il suo logo in `launcher-icon.tsx`. Mostrati come icone sulle card, sulle righe
  della lista e accanto allo sviluppatore nella scheda del gioco (con nome e tooltip per chi usa lo screen
  reader), per esteso nei dettagli, e come filtro "Launcher" in libreria (`?launcher=steam,ea-app`). I giochi
  Nintendo e console restano gestiti dalle piattaforme e non hanno launcher.
- **Loghi dei marchi** (`src/components/ui/launcher-icon.tsx`): `lucide-react` non ha icone di marchi, quindi i
  tracciati SVG vengono da Simple Icons (licenza CC0). `SteamIcon` è usata anche davanti al link al profilo
  Steam in About e nel footer.
- Componenti shadcn in `src/components/ui`; `ButtonLink` rende un link con l'aspetto di un bottone (così
  il ruolo ARIA resta `link`).
- Il toast (Sonner, solo tema scuro) è in alto a destra per non coprire il pulsante "Add game" fisso.
- Le card, le righe e le copertine condividono `game-cover`, `badges` (Online, voto, stato).
- I 404 usano il componente condiviso `NotFoundView`: `src/app/not-found.tsx` (con header e footer) e
  `src/app/(site)/not-found.tsx` (dentro il layout del sito, senza duplicarli).
