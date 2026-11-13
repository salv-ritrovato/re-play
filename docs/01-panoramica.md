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

- **Overview** (`/`): numeri chiave (giochi, ore giocate, voto medio, studi diversi), il **carosello "Standout reviews"** (le
  recensioni dei giochi con voto 9 o più, al massimo 5, anche in italiano), il gioco scelto con "Feature on the
  home page" (se c'è) e gli scaffali
  "Recently added" (solo i giochi aggiunti negli ultimi 7 giorni, `RECENT_DAYS`; se non ce ne sono, lo
  scaffale non compare), "Browse by genre" (i dieci generi più grandi, con il numero di giochi; "All genres" apre la
  pagina con tutti, e ogni blocco la libreria già filtrata), "Highest rated" e "Lowest rated" ("The blunt truth": mai gli
  stessi giochi di "Highest rated"). Nell'intestazione c'è anche **"Surprise me"**, che apre un gioco a caso
  (`/random`), e in fondo una striscia "Who's behind the reviews" con il link all'About. Non c'è più "Playing now": i giochi si aggiungono
  quando sono finiti.
- **Ricerca nella navbar** (icona a lente, in ogni pagina; si apre anche con `/` o Ctrl/Cmd+K): si scrive un
  titolo, uno sviluppatore o un publisher e compaiono subito i primi sei giochi con copertina, anno e voto.
  Frecce per scegliere, Invio apre il gioco evidenziato (o la Library filtrata se nulla corrisponde),
  "Show all N results" porta alla Library con la stessa ricerca.
- **Library** (`/library`): tutti i giochi in vista griglia o lista, con ricerca, filtri combinabili
  (genere, piattaforma, anno, stato, completamento, voto, tipo solo/online), ordinamenti e paginazione.
  Filtri e ordinamento vivono nell'URL, quindi ogni vista è condivisibile. Tutto avviene **subito, nel
  browser**: ricerca (mentre si scrive), filtri, ordinamento e cambio pagina non chiedono nulla al server.
- **Genres** (`/genres`): tutti i generi con il numero di giochi; cliccandone uno si apre la Library già
  filtrata su quel genere. I nomi dei generi sono link anche nella scheda del gioco e nelle righe della lista.
- **Gioco** (`/games/[slug]`): scheda con copertina, metadati, voto, pro e contro e recensione in inglese e
  italiano (tab EN/IT). In alto un colpo d'occhio con voto, stato, completamento e ore. Accanto alla
  recensione c'è la scheda **"My playthrough"** (resta in vista mentre si scorre) con ciò che in alto non c'è:
  data di completamento e launcher ("Played via"). Niente è ripetuto due volte. Le piattaforme
  restano tra i dettagli del gioco, perché indicano dove il gioco *esce*, non dove è stato giocato.
- **Sviluppatore** (`/developers/[slug]`): cliccando il nome di uno sviluppatore (su card, righe della lista,
  gioco in evidenza e scheda del gioco) si apre la pagina con tutti i suoi giochi, dal più recente, con
  numero di giochi e voto medio. Se il campo ne elenca più d'uno ("2K Australia, Gearbox Software") ogni
  studio ha il suo link e la sua pagina.
- **Publisher** (`/publishers/[slug]`): come lo sviluppatore. Il nome del publisher nella scheda del gioco apre
  la pagina con tutti i giochi che ha pubblicato (numero di giochi e voto medio).
- **Reviews** (`/reviews`): solo i giochi recensiti, con anteprima e selezione lingua (`?lang=it`). Come la
  Library, ricerca, ordinamento, lingua e pagine cambiano **subito, nel browser**. Il pulsante "RSS" apre il
  feed delle ultime 20 recensioni (`/reviews/feed.xml`, in inglese, con il **testo completo**).
- **Statistics** (`/statistics`): totali, generi, piattaforme, launcher, solo/online, i cinque giochi con più
  ore, distribuzione dei voti, giochi per anno.
- **About** (`/about`): presentazione personale in italiano e inglese, riquadro "In breve" e link al
  profilo Steam (presente anche nel footer). Una sezione spiega il metodo ("Come gioco e recensisco": giochi completi
  con DLC ed espansioni, DLC trattati a parte solo se meritano un paragrafo) e quali client PC usa (Steam, Ubisoft
  Connect, Battle.net, EA app).
- **404** dedicate (sito e admin) che mantengono header e footer.

### Parte privata (`/admin`)

Accesso con username e password su `/login`. Elenco giochi con ricerca e filtri, **backup** (pulsante "Backup": scarica tutti i giochi in un unico file JSON), creazione, modifica ed
eliminazione, upload della copertina, creazione al volo di generi e piattaforme. Dettagli in
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
  versione contratta "Re:" + triangolo play (`public/brand/replay-logo-compact.png`) sotto, favicon a triangolo "play" (`src/app/icon.svg`).
- **Colore dei voti**: sono l'unico tocco caldo del sito. Da 9 in su il voto è oro, sotto 5 è rosso spento, in mezzo
  resta neutro (card, liste, scheda del gioco, ricerca, istogramma dei voti nelle statistiche).
- **Atmosfera**: dietro l'intestazione della home c'è una parete inclinata con le copertine dei giochi meglio votati
  (solo da `lg` in su, decorativa); nella scheda di ogni gioco un alone morbido del colore principale della
  copertina; le card compaiono con una breve dissolvenza e si sollevano al passaggio del mouse (niente
  animazioni per chi ha chiesto di ridurle).
- **Dettagli di lettura e di contesto**: il carosello e la scheda del gioco hanno l'alone del colore della copertina;
  nella libreria, passando il mouse su una card, sulla copertina scorrono generi e ore giocate (non sul tocco);
  nelle statistiche il calendario "When I finished games" mostra, per ogni mese di ogni anno, quanti giochi hai
  finito; le recensioni si leggono a paragrafi con il primo in evidenza; aprendo un gioco dalla libreria la copertina
  si trasforma in quella della pagina (dove il browser lo supporta); il sito si può aggiungere alla schermata Home
  del telefono, con l'icona "Re:▶".
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
