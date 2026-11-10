# Database (Supabase / Postgres)

Le migrazioni sono in `supabase/migrations/` e vanno applicate **in ordine** (SQL editor di Supabase oppure
`supabase db push`).

## Tabelle

| Tabella | Contenuto |
| --- | --- |
| `profiles` | Un record per utente auth, con `role` (`owner`). Il primo utente creato diventa `owner`. |
| `games` | Il gioco: `slug`, `title`, descrizioni, `release_date`, `developer`, `publisher`, `rating` (0-10), `play_status`, `completion_status`, `playtime_hours`, `completed_on`, `review_en`, `review_it`, `pros[]`, `cons[]`, `cover_path`, `cover_blur`, `featured`, `is_online`, timestamp. |
| `genres`, `platforms`, `tags` | Tassonomie con nome univoco (case-insensitive) e `slug`. Generi e piattaforme sono precaricati. |
| `game_genres`, `game_platforms`, `game_tags` | Tabelle ponte molti-a-molti. |

Tipi enumerati: `play_status` (`backlog`, `playing`, `completed`, `on_hold`, `dropped`) e
`completion_status` (`none`, `main_story`, `completionist`).

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
  completamento, sviluppatore, publisher, solo recensiti, online sì/no), ordinamento e paginazione in una sola
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

Le migrazioni sono già applicate al progetto Supabase in uso. Per un progetto nuovo vanno eseguite tutte, in
ordine.
