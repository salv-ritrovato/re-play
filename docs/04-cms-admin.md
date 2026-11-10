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
piattaforme, tag, voto, stato di gioco, stato di completamento, ore di gioco, data di completamento
(opzionale), recensione in inglese e in italiano, pro e contro, "in evidenza", interruttore **Online**,
copertina.

Comportamenti da conoscere:

- **Recensioni a coppia**: se si compila una lingua, l'altra è obbligatoria.
- **Reset dopo il salvataggio e su "Cancel"**: `resetForm({ values })`. Senza, Next riutilizzerebbe lo stato
  del gioco precedente (le pagine visitate restano in memoria).
- **Protezione dalle perdite di dati**: `beforeunload` avvisa se ci sono modifiche non salvate.
- **Creazione al volo** di generi, piattaforme e tag (`taxonomy-picker`, `tag-input`).
- **Copertina** (`media-fields`): anteprima, sostituzione, rimozione; compressa nel browser prima dell'invio.

## Server actions (`src/app/admin/actions.ts`)

| Action | Cosa fa |
| --- | --- |
| `saveGame` | Valida → elabora la copertina → upsert del gioco → aggiorna relazioni e tag → carica la copertina → invalida la cache. |
| `deleteGame` | Elimina il gioco e il relativo file di copertina. Il pulsante chiede conferma (`delete-game-button`). |
| `createTaxonomy` | Crea un genere/piattaforma/tag. Non invalida la cache, di proposito, per non ricaricare la pagina durante la modifica di un form. |

Ogni action verifica il proprietario con `assertOwner()` e restituisce un `ActionResult` (successo o errore)
mostrato con un toast.

## Operazioni da fare a mano su Supabase

- Disattivare **Allow new users to sign up** (Authentication → Sign In / Providers).
- Ruotare la password del database (è stata condivisa in chat durante lo sviluppo).
- Rimuovere il collegamento MCP temporaneo a Supabase: `claude mcp remove supabase --scope local`.
