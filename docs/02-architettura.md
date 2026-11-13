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
   per non inviare file enormi. Il tipo del file si legge dai **primi byte** (`sniffImageType`), non dal nome: un
   file scaricato senza estensione, o rinominato, viene riconosciuto lo stesso. Se la conversione non rende il
   file più piccolo (tipico degli AVIF, già molto compressi) il file originale viene inviato così com'è.
2. **Server** (`src/lib/images.ts`, `sharp`): rotazione EXIF, rimozione metadati, ritaglio 3:4 a
   900×1200, WebP qualità 80, e calcolo di un **blur placeholder** salvato in `games.cover_blur`. Il ritaglio
   tiene la parte più interessante dell'immagine (`sharp.strategy.attention`), ma una grafica con proporzioni
   molto diverse da 3:4 perde i bordi.

**Formati accettati** (`src/lib/image-formats.ts`, regole condivise da browser e server): JPEG, PNG, WebP e
AVIF (più GIF e TIFF, non proposti). Attenzione: `sharp` chiama **"heif"** un file AVIF (con compressione
"av1"), mai "avif"; le foto HEIC degli iPhone sono anch'esse "heif" ma con compressione "hevc" e non si
possono leggere. `isAcceptedFormat` tiene conto di questo, e `unsupportedMessage` dà un messaggio chiaro per
HEIC, SVG e il resto.

In lettura, `next/image` serve AVIF/WebP alla dimensione giusta (`qualities` 55/60/75/85, `remotePatterns`
verso Supabase). Le server action accettano body fino a 12 MB (`serverActions.bodySizeLimit`).

## Ricerca, filtri, ordinamento, paginazione

- **Library: tutto nel browser.** `getLibraryGames()` (in cache) legge l'intero archivio con `library_search`
  (senza i testi delle recensioni, `LibraryRecord`, fino a 1000 giochi) e lo passa a `LibraryBrowser`
  (`src/components/games/library-browser.tsx`), che con `filterLibrary` (`src/lib/library-filter.ts`)
  cerca, filtra, ordina e impagina (24 per pagina) senza altre richieste. L'URL resta la fonte di verità ma si
  aggiorna sul posto con `history.replaceState` (`useQueryParams({ shallow: true })`; Next lo tiene allineato con
  `useSearchParams`): un link condiviso arriva già filtrato, perché la pagina legge lo stesso URL. La ricerca
  filtra a ogni tasto, l'URL si aggiorna dopo 300 ms. `filterLibrary` rispecchia la funzione SQL (stessi criteri e
  stessi ordinamenti, a parità di voto vince il più recente): un test lo confronta con il database per ogni
  ordinamento e per i filtri principali.
- **Ricerca nella navbar** (`src/components/layout/nav-search.tsx`): al primo clic scarica `/search-index`
  (route handler, `getSearchIndex()` in cache: slug, titolo, sviluppatore, publisher, anno, voto, copertina di
  ogni gioco; non indicizzata da `robots`) e la tiene per tutta la visita. `searchEntries`
  (`src/lib/search-index.ts`) filtra mentre si scrive: ogni parola deve comparire in titolo, sviluppatore o
  publisher (senza badare a maiuscole e accenti); prima i titoli che iniziano con la ricerca, poi quelli che la
  contengono. È un pannello (`Sheet`, dall'alto) con ruoli ARIA di combobox/listbox.
- **Reviews: anche nel browser.** `getReviewEntries()` (in cache) manda al browser i giochi recensiti con
  l'inizio dei testi in inglese e italiano (`ReviewEntry`, 360 caratteri ciascuno, non i testi interi);
  `ReviewsBrowser` usa lo stesso `filterLibrary` (generico) e il parametro `lang` dell'URL. 12 per pagina.
- La funzione SQL `library_search` (vedi [03-database.md](03-database.md)) alimenta ormai solo i dati caricati
  dal server: `getLibraryGames`, `getReviewEntries`, il carosello e gli scaffali della home.
- **Sitemap e SEO**: `src/app/sitemap.ts` elenca sezioni, giochi (con `lastModified`), sviluppatori e publisher
  (`getSitemapData`); `robots.ts` la annuncia. Il feed RSS è un route handler (`(site)/reviews/feed.xml`, `getFeedReviews`: ogni voce ha una breve `description` e la recensione intera in `content:encoded`, a paragrafi) e la pagina
  Reviews lo dichiara con `alternates`. L'indirizzo base viene da `NEXT_PUBLIC_SITE_URL`.
- **Backup**: `/admin/export` (route handler, solo owner: sessione verificata con `assertOwner`, e il proxy rimanda
  gli anonimi al login) restituisce tutti i giochi con ogni campo (recensioni, pro e contro, generi e piattaforme
  per nome) più gli elenchi di generi e piattaforme, come file `replay-backup-AAAA-MM-GG.json`. Le copertine
  restano in Storage: il file riporta i percorsi.
- `parseLibraryParams` (`src/lib/library-params.ts`) è difensivo: UUID non validi, numeri non numerici,
  ordinamenti sconosciuti o pagine negative vengono ignorati senza errori.
- `useQueryParams` (`src/hooks/use-query-params.ts`) tiene l'ultima query in un `ref` per non perdere
  aggiornamenti in caso di click ravvicinati sui filtri. `Pagination` accetta `onPageChange` per cambiare pagina
  sul posto (i link restano come ripiego, anche per aprire una pagina in una nuova scheda).
- **Generi**: `getGenreList()` alimenta la pagina `/genres` (tutti i generi con almeno un gioco, dal più
  grande); la home ne mostra i primi dieci. `GenreLinks` rende i nomi dei generi link a `/library?genre=<id>`.
- La pagina Reviews usa gli stessi parametri con opzioni di ordinamento dedicate (`REVIEW_SORT_OPTIONS`).

## Aspetto (rifiniture)

- **Voti a colori**: `ratingTier` (`src/lib/format.ts`: "high" da 9, "low" sotto 5, "mid" il resto) e i token
  `--rating-high` / `--rating-low` in `globals.css` (classi `text-rating-high`, `bg-rating-high`...). `Rating`, la
  ricerca nella navbar e le colonne dei voti nelle statistiche li usano.
- **Parete di copertine** (`hero-covers.tsx`): `getHomeData().heroCovers` (le 18 copertine dei giochi meglio votati),
  inclinata, a bassa opacità e sfumata con una maschera; `aria-hidden`, immagini senza testo alternativo, nascosta
  sotto `lg`.
- **Alone della copertina** (`src/lib/cover-tint.ts`, solo server): il colore medio del segnaposto sfocato già salvato con
  il gioco (`cover_blur`), con la saturazione alzata e schiarito se la copertina è scura; due gradienti radiali a bassa
  opacità dietro l'intestazione della scheda. Niente richieste in più.
- **Movimento** (`src/lib/motion.ts`): `REVEAL` e `revealDelay` (dissolvenza con piccolo scatto verso l'alto, ritardo
  scaglionato fino a 12 elementi) con il prefisso `motion-safe`; le card della libreria e degli scaffali si sollevano
  all'hover, tranne con `prefers-reduced-motion`.
- **Alone condiviso**: `glowBackground()` (`src/lib/cover-tint.ts`) genera lo sfondo per la scheda del gioco e per ogni
  slide del carosello (`StandoutSlide.glow`, calcolato sul server).
- **Dettagli sulle card**: `GameCover` accetta `details`, uno strato decorativo (`aria-hidden`, mai sopra ai clic)
  che compare con `group-hover`/`group-focus-within`; la variante `hover:` di Tailwind v4 vale solo dove esiste un vero
  hover, quindi sul tocco non compare e non resta "bloccato".
- **Transizione della copertina**: `<ViewTransition name="cover-<slug>" share="morph" default="none">` (React 19.3,
  nessuna configurazione in Next) attorno alla copertina della card della libreria (`GameCard morph`) e a quella della
  scheda del gioco. Il nome deve essere unico nella pagina, quindi si usa solo dove ogni gioco compare una volta (non negli
  scaffali della home). CSS in `globals.css`, spento con `prefers-reduced-motion`; senza supporto del browser non cambia nulla.
- **Calendario dei completamenti**: `MonthGrid` (`components/stats/charts.tsx`), una vera `<table>` (un anno per riga, un mese per
  colonna, quadrati più scuri con più giochi, 4 livelli), dati da `getStats().completions` (conteggio per mese delle `completed_on`).
  Larghezza massima `max-w-2xl`; su telefono i mesi sono una lettera e i quadrati restano di almeno 14 px.
- **Recensioni**: `ReviewTabs` rende un paragrafo per riga di testo; `.prose-review > p:first-child` è più grande e più
  chiaro (apertura), larghezza massima 66 caratteri.
- **App sul telefono**: `src/app/manifest.ts` (nome, colori, `display: standalone`), icone in `public/icons/` (192, 512 e
  una "maskable" con margine di sicurezza) e `src/app/apple-icon.png`, tutte con il logo contratto su fondo scuro.
- **Statistiche**: il componente `Donut` (SVG puro, in `components/stats/charts.tsx`) mostra launcher e solo/online con
  legenda (quota e numero).

## Immagini di anteprima (Open Graph)

Quando si condivide un link (chat, social), compare un'immagine 1200×630 generata dal sito, con lo stile del
sito: sfondo scuro, logo Re:Play, un'etichetta, il titolo in grande, una riga di contesto e, a destra,
copertine. Non ci sono numeri (giochi giocati, ore): l'immagine viene conservata da chat e social per giorni e
un numero resterebbe vecchio. Ogni sezione ha la sua, con i file `opengraph-image.tsx` della convenzione di Next:

| Pagina | Immagine |
| --- | --- |
| Home (e pagine senza una propria) | `src/app/opengraph-image.tsx`: copertine dei giochi meglio votati |
| Library | `(site)/library/opengraph-image.tsx`: gli ultimi giochi aggiunti |
| Reviews | `(site)/reviews/opengraph-image.tsx`: altre copertine, diverse dalla home |
| Statistics | `(site)/statistics/opengraph-image.tsx`: copertine dei giochi meglio votati, nessun numero |
| About | `(site)/about/opengraph-image.tsx`: solo testo |
| Gioco | `(site)/games/[slug]/opengraph-image.tsx`: copertina, titolo, sviluppatore/anno e voto |
| Sviluppatore | `(site)/developers/[slug]/opengraph-image.tsx`: nome, numero di giochi, voto medio e copertine |
| Publisher | `(site)/publishers/[slug]/opengraph-image.tsx`: come lo sviluppatore |

Il disegno comune sta in `src/lib/og.tsx` (`renderOg`); i dati in `getOgOverview()`. Le copertine, salvate in
WebP, vengono lette e ridotte a piccoli JPEG con `sharp` prima di entrare nell'immagine. Le immagini sono
generate al momento della richiesta e riutilizzate per un'ora (browser e CDN). Il layout (`layout.tsx`) chiede
la scheda grande per X (`twitter:card = summary_large_image`) e indica il nome del sito. Gli indirizzi nelle
anteprime sono assoluti e derivano da `NEXT_PUBLIC_SITE_URL`: in produzione deve essere l'indirizzo vero del
sito. Chat e social tengono l'anteprima in cache: dopo una modifica può servire "ripulirla" dai loro strumenti
di debug.

## Home

**Carosello "Standout reviews"** (`src/components/games/standout-carousel.tsx`): una slide per gioco con
copertina, titolo, anno e sviluppatore, voto, l'inizio della recensione e il link "Read the full review"
(anche la copertina e il titolo aprono la pagina del gioco; il link sulla copertina è nascosto a tastiera e a
screen reader perché il titolo porta già allo stesso posto). I
giochi sono quelli con voto **almeno 9** (`STANDOUT_MIN_RATING`) e una recensione, dal voto più alto, **al
massimo 5** (`STANDOUT_MAX`), presi con `library_search`. Scorre di lato con scorrimento a scatti (swipe, frecce,
puntini e tasti freccia), non parte da solo e ha i ruoli ARIA di un carosello; un selettore English/Italiano
cambia la lingua dell'estratto. Le frecce **ricominciano da capo**: dopo l'ultima recensione si torna alla
prima, e "indietro" dalla prima porta all'ultima. Sono accanto al titolo su schermi larghi e ai lati dei
puntini su telefono (pulsanti più grandi da toccare). Con una sola recensione i comandi non compaiono. Prende il posto dell'ex
"Standout" automatico: il blocco "Featured" resta solo per il gioco scelto a mano nel form.

`getHomeData()` (`src/lib/data/public.ts`, in cache) prepara tutto in una volta: numeri, gioco in evidenza,
scaffali e i dati dei nuovi blocchi. Il quarto numero in cima ("Studios") è `studioCount`: i nomi di
`filter_developers` passano da `splitDevelopers` e `slugify`, quindi "A, B" conta due studi e lo stesso studio
in più giochi conta una volta sola. I generi per "Browse by genre" arrivano da `genres` con il conteggio
delle righe di `game_genres`; "Lowest rated" usa `library_search` con ordinamento `rating_asc` ed esclude i
giochi già in "Highest rated". "Surprise me" punta a `src/app/(site)/random/route.ts`: un route handler che,
con `connection()` per non essere prerenderizzato, sceglie uno slug a caso da `getAllSlugs()` e risponde con un
redirect 307 (verso la libreria se l'archivio è vuoto), con `Cache-Control: no-store`. Ogni clic porta a un
titolo diverso: un piccolo cookie (`random_seen`, gli ultimi 30 slug mostrati, 30 giorni, nessun dato personale)
ricorda gli ultimi giochi proposti e li esclude, quindi non si ripete mai lo stesso gioco di fila e, con pochi
giochi, si vedono quasi tutti prima che uno ricompaia. Il pulsante non usa il prefetch, perché aprirebbe un
gioco a caso già in anticipo.

## Pagine degli sviluppatori

- Il campo `developer` è testo libero e spesso elenca più studi separati da virgola o punto e virgola.
  `splitDevelopers` (`src/lib/developers.ts`) lo scompone in nomi singoli (senza doppioni; "Inc.", "Ltd" e
  simili restano attaccati al nome che li precede) e `developerHref` costruisce l'indirizzo
  `/developers/<slug>`, dove lo slug è `slugify(nome)`.
- I **publisher** funzionano allo stesso modo: `publisherHref` costruisce `/publishers/<slug>`, `getPublisherGames` e
  `getDeveloperGames` condividono la stessa logica (`companyGames`, che usa `filter_publishers` o
  `filter_developers`) e `DeveloperLinks` con `kind="publisher"` rende i link nella scheda del gioco.
- Le **Statistiche** nuove (launcher, solo/online, più giocati) si calcolano da `getLibraryGames()` dentro
  `getStats()`, senza viste SQL aggiuntive.
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
  reader), per esteso nei dettagli (etichetta pubblica "Played via"; nel form e nei filtri resta "Launcher", più chiaro quando
  si sceglie), e come filtro "Launcher" in libreria (`?launcher=steam,ea-app`). I giochi
  Nintendo e console restano gestiti dalle piattaforme e non hanno launcher.
- **Footer** (`site-footer.tsx`): due gruppi separati. In alto i link del sito (Library, Reviews, Statistics,
  About, Admin); sotto, in una riga a parte "Find me elsewhere", i profili esterni come icone (Steam,
  Instagram, AniList, inLumine). Gli indirizzi e le descrizioni stanno in `src/content/links.ts`
  (`SOCIAL_LINKS`); le icone in `src/components/ui/social-icon.tsx`. Instagram e AniList vengono da Simple
  Icons (CC0); il logo di inLumine è una versione monocromatica del quadrato nel quadrato dell'icona del loro
  sito. Il link ad AniList punta alla home del sito: per mostrare il profilo basta cambiare l'indirizzo.
- **Loghi dei marchi** (`src/components/ui/launcher-icon.tsx`): `lucide-react` non ha icone di marchi, quindi i
  tracciati SVG vengono da Simple Icons (licenza CC0). `SteamIcon` è usata anche davanti al link al profilo
  Steam in About e nel footer.
- Componenti shadcn in `src/components/ui`; `ButtonLink` rende un link con l'aspetto di un bottone (così
  il ruolo ARIA resta `link`).
- Il toast (Sonner, solo tema scuro) è in alto a destra per non coprire il pulsante "Add game" fisso.
- Le card, le righe e le copertine condividono `game-cover`, `badges` (Online, voto, stato).
- I 404 usano il componente condiviso `NotFoundView`: `src/app/not-found.tsx` (con header e footer) e
  `src/app/(site)/not-found.tsx` (dentro il layout del sito, senza duplicarli).
