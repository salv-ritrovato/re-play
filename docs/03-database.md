# Database (Supabase / Postgres)

Le migrazioni sono in `supabase/migrations/` e vanno applicate **in ordine** (SQL editor di Supabase oppure
`supabase db push`).

## Tabelle

| Tabella | Contenuto |
| --- | --- |
| `profiles` | Un record per utente auth, con `role` (`owner`). Il primo utente creato diventa `owner`. |
| `games` | Il gioco: `slug`, `title`, descrizioni, `release_date`, `developer`, `publisher`, `rating` (0-10), `play_status`, `completion_status`, `playtime_hours`, `completed_on`, `review_en`, `review_it`, `pros[]`, `cons[]`, `cover_path`, `cover_blur`, `featured`, `is_online`, timestamp. |
| `games.launchers` | Colonna `text[]` con i launcher su cui il gioco è posseduto (`steam`, `ubisoft-connect`, `ea-app`, `battle-net`). Vuota per i giochi console, già coperti dalle piattaforme. I valori ammessi sono validati nell'app (`LAUNCHERS` in `src/lib/types.ts`), quindi aggiungere un launcher non richiede una migrazione. Indice GIN `games_launchers_idx`. |
| `games.rank` | Testo libero, solo per i giochi online: il rank raggiunto ("Diamond", "Legend"...) oppure "None" se il gioco non ha classifica. Vuoto negli altri casi. Vincoli: non vuoto, al massimo 40 caratteri, ammesso solo se `is_online`. |
| `genres`, `platforms` | Tassonomie con nome univoco (case-insensitive) e `slug`, precaricate. |
| `game_genres`, `game_platforms` | Tabelle ponte molti-a-molti. |

Tipi enumerati: `play_status` (`backlog`, `playing`, `completed`, `on_hold`, `dropped`) e
`completion_status` (`none`, `main_story`, `main_story_side_quests`, `completionist`; in interfaccia:
"Not completed", "Main story", "Main story + side quests", "100%").

Vincoli notevoli: titolo non vuoto, formato dello `slug`, voto tra 0 e 10, ore di gioco non negative,
recensioni "entrambe o nessuna". Il trigger `set_updated_at` aggiorna `updated_at`. Indici su data di
creazione, voto, data di uscita, stato, sviluppatore/publisher, `featured`, `is_online`, `completed_on` e
indici trigram (`pg_trgm`) su titolo, sviluppatore e publisher per la ricerca testuale.

## Sicurezza (RLS)

- Lettura pubblica di giochi, tassonomie e relazioni.
- Scrittura consentita solo se `is_owner()` è vero.
- `profiles`: ognuno legge solo il proprio record.
- Storage `game-media`: lettura pubblica, insert/update/delete solo per il proprietario.
- Le viste usano `security_invoker = true`, quindi rispettano la RLS di chi le interroga.

## Funzioni e viste

- **`library_search(...)`**: ricerca, filtri (testo, generi, piattaforme, anni, voto min/max, stato,
  completamento, sviluppatore, publisher, solo recensiti, online sì/no, launcher), ordinamento e paginazione in una sola
  chiamata; restituisce anche il totale.
- **`stats_totals`, `stats_genres`, `stats_platforms`, `stats_rating_distribution`, `stats_games_by_year`**:
  alimentano la pagina Statistics (l'anno deriva da `completed_on`).
- **`filter_developers`, `filter_publishers`, `filter_years`**: valori disponibili per i filtri.
- **`is_owner()`**, **`handle_new_user()`** (trigger sulla creazione utente), **`set_updated_at()`**.

## Storico migrazioni

| File | Cosa fa |
| --- | --- |
| `20261109120000_init.sql` | Schema iniziale, RLS, bucket storage, `library_search`, viste statistiche, generi e piattaforme di base. |
| `20261110090000_bilingual_reviews.sql` | Recensioni in due lingue (`review_en`/`review_it`) con vincolo "entrambe o nessuna"; aggiorna `stats_totals`. |
| `20261110130000_online_games.sql` | Aggiunge `is_online` e il parametro `p_online` a `library_search`. |
| `20261110150000_remove_start_and_review_dates.sql` | Rimuove `started_on`, `reviewed_on`, `last_played_on`; ricrea `stats_games_by_year` (da `completed_on`) e `library_search`. |
| `20261110170000_remove_notes_and_extra_images.sql` | Rimuove `game_images`, il tipo `image_kind` e `games.notes`. |
| `20261111090000_main_story_side_quests.sql` | Aggiunge il livello di completamento `main_story_side_quests` tra `main_story` e `completionist`. |
| `20261114090000_remove_tags.sql` | Elimina `game_tags` e `tags`: i tag personali non esistono più (nessun gioco ne aveva). Va applicata dopo che il codice senza tag è online. |
| `20261113090000_online_rank.sql` | Aggiunge `games.rank` (testo, solo per i giochi online) con i vincoli di lunghezza e "solo online". |
| `20261112090000_launchers.sql` | Aggiunge `games.launchers` (tutti i giochi esistenti partono con `steam`, perché finora vengono tutti da Steam), l'indice GIN e ricrea `library_search` con il parametro `p_launchers` e la colonna `launchers` nel risultato. |

Le migrazioni sono già applicate al progetto Supabase in uso. Per un progetto nuovo vanno eseguite tutte, in
ordine.
