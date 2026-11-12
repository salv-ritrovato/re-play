# CMS e area admin

Tutto sotto `/admin`, accessibile solo al proprietario (vedi i tre livelli di protezione in
[02-architettura.md](02-architettura.md)).

## Pagine

| Percorso | Funzione |
| --- | --- |
| `/login` | Accesso con username e password. Se già autenticati si viene portati a `/admin`. |
| `/admin` | Dashboard: giochi registrati, giochi senza copertina, giochi senza recensione (ognuno con link all'elenco filtrato) e scorciatoia "Add game". |
| `/admin/games` | Elenco dei giochi con ricerca e filtri (`admin-games-filters`), tabella responsive. |
| `/admin/games/new` | Nuovo gioco. |
| `/admin/games/[id]/edit` | Modifica di un gioco esistente. |

## Il form del gioco (`src/components/admin/game-form.tsx`)

Basato su React Hook Form + Zod (`gameSchema` in `src/lib/validation.ts`).

Campi: titolo e slug, descrizione breve e completa, data di uscita, sviluppatore, publisher, generi,
piattaforme, **launcher** (Steam, Ubisoft Connect, EA app, Battle.net, scelta multipla; vuoto per i giochi console),
voto, stato di gioco, stato di completamento, ore di gioco, data di completamento
(opzionale), recensione in inglese e in italiano, pro e contro, "in evidenza", interruttore **Online**,
copertina.

Comportamenti da conoscere:

- **Recensioni a coppia**: se si compila una lingua, l'altra è obbligatoria.
- **Reset dopo il salvataggio e su "Cancel"**: `resetForm({ values })`. Senza, Next riutilizzerebbe lo stato
  del gioco precedente (le pagine visitate restano in memoria).
- **Protezione dalle perdite di dati**: `beforeunload` avvisa se ci sono modifiche non salvate.
- **Decimali sempre col punto** (voto 8.5, ore 12.5): i campi sono di testo e non "numerici", perché il browser
  italiano mostrerebbe la virgola. Una virgola digitata o incollata diventa subito un punto (`decimalPoint`,
  `src/lib/text.ts`), e il server fa lo stesso al salvataggio. Il sito mostra già ovunque il punto.
- **Asterischi tolti in automatico**: nei campi di testo (descrizioni, recensioni in inglese e italiano, pro e
  contro) gli asterischi, residui del grassetto del testo incollato (`**così**`), spariscono appena incollati
  nel form, e il server li toglie comunque al salvataggio (`stripAsterisks` in `src/lib/text.ts`, usata da
  `gameSchema`). Un testo fatto solo di asterischi conta come vuoto.
- **Giochi online / competitivi** (interruttore "Online / competitive game"): non hanno una fine, quindi
  accendendo l'interruttore il form nasconde "Completion status" e "Completion date" (e li azzera), toglie
  "Completed" e "Backlog" dalle scelte di "Playing status" (restano Playing, On hold, Dropped, e se serve
  passa a Playing) e mostra una nota. La stessa regola vale sul server (`gameSchema`): un gioco online non può
  avere livello o data di completamento né stato "completed". Sul sito pubblico un gioco online non mostra
  il completamento (scheda in alto, lista, data nella barra laterale).
  Al posto del completamento c'è il **rank raggiunto** ("Rank reached"): testo libero con scelte rapide
  (None, Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, Champion). "None" serve per i giochi
  senza classifica. Il rank compare nel blocco in alto della scheda del gioco, al posto del completamento,
  e solo se compilato; spegnendo l'interruttore online viene azzerato. Le scelte rapide stanno in
  `RANK_SUGGESTIONS` in `src/lib/types.ts`.
- **Aggiungi e aggiungine un altro** (solo su "Nuovo gioco"): il pulsante "Add and add another" salva il gioco,
  mostra un avviso e riapre il form **vuoto** con il cursore sul titolo, senza tornare all'elenco. Non porta
  con sé nulla del gioco appena salvato (per i dati in comune si usa il punto successivo).
- **Parti da un gioco esistente** (solo su "Nuovo gioco", componente `copy-from-game.tsx`): in cima al form
  si cerca per titolo o sviluppatore, oppure si sceglie tra gli ultimi giochi toccati. Copia **sviluppatore,
  publisher, generi, piattaforme, launcher e flag online**; mai titolo, voto, recensioni, copertina o date.
  Dopo la copia il box elenca esattamente cosa è stato copiato (sviluppatore, publisher, generi, piattaforme,
  launcher, online), con il pulsante "Show me" che porta ai campi compilati, più in basso nella pagina.
  Si può modificare tutto. Utile per serie, sequel e giochi dello stesso studio.
- **Creazione al volo** di generi e piattaforme (`taxonomy-picker`).
- **Copertina** (`media-fields`): anteprima, sostituzione, rimozione; compressa nel browser prima dell'invio.

## Server actions (`src/app/admin/actions.ts`)

| Action | Cosa fa |
| --- | --- |
| `saveGame` | Valida → elabora la copertina → upsert del gioco → aggiorna relazioni e tag → carica la copertina → invalida la cache. |
| `deleteGame` | Elimina il gioco e il relativo file di copertina. Il pulsante chiede conferma (`delete-game-button`). |
| `searchGameTemplates` | Cerca fino a 8 giochi (per titolo/sviluppatore, o gli ultimi modificati se la ricerca è vuota) e restituisce solo i dati copiabili. Usata da "Parti da un gioco esistente". |
| `createTaxonomy` | Crea un genere/piattaforma/tag. Non invalida la cache, di proposito, per non ricaricare la pagina durante la modifica di un form. |

Ogni action verifica il proprietario con `assertOwner()` e restituisce un `ActionResult` (successo o errore)
mostrato con un toast.

## Operazioni da fare a mano su Supabase

- Disattivare **Allow new users to sign up** (Authentication → Sign In / Providers).
- Ruotare la password del database (è stata condivisa in chat durante lo sviluppo).
- Rimuovere il collegamento MCP temporaneo a Supabase: `claude mcp remove supabase --scope local`.
