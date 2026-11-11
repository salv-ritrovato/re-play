# Cronologia del lavoro

Cosa è stato fatto, nell'ordine, e i problemi incontrati con le relative soluzioni. Utile per capire il
"perché" di certe scelte nel codice.

## 1. Fondamenta

- Progetto Next.js 16 con Cache Components, TypeScript, Tailwind v4, shadcn/ui.
- Supabase dedicato a Re:Play (creato un progetto nuovo, non riusato quello di un altro lavoro).
- Schema iniziale con RLS, bucket storage, funzione `library_search`, viste statistiche e dati di base.
- Utente proprietario creato su Supabase (`Heavxn`, unico amministratore); login per username.
- Installati i server MCP **shadcn** e **playwright** per lavorare sul progetto.
- Repository GitHub `salv-ritrovato/re-play`; push via SSH personale.

## 2. Sito pubblico e CMS

- Pagine Overview, Library (griglia/lista, filtri combinabili, ordinamenti, paginazione), scheda gioco,
  Reviews, Statistics.
- CMS completo sotto `/admin`: CRUD dei giochi, upload copertina, tassonomie create al volo.
- **Copertine ottimizzate e compresse** (richiesta esplicita): compressione nel browser + `sharp` sul server.
- **Recensioni bilingue** EN/IT obbligatorie a coppia (migrazione `bilingual_reviews`).
- Logo "Re:Play" e favicon; rinominato il sito da "Re" a "Re:Play".
- Prima messa online su Vercel; il primo deploy è fallito per variabili d'ambiente mancanti, poi aggiunte.

## 3. Evoluzioni richieste

| Richiesta | Esito |
| --- | --- |
| Il form "Nuovo gioco" ricordava i dati del precedente | `resetForm` dopo salvataggio e "Cancel"; test dedicato. |
| Giochi online/competitivi, ma dentro la libreria | Colonna `is_online`, badge "Online", filtro "Type" (solo/online), interruttore nel form. |
| Un "+" verde come controparte del "-" verde dell'altro lato | Aggiunto il "+" verde per coerenza con il "-". |
| Sostituire le lineette (em/en dash) con trattini | Testi e interfaccia aggiornati. |
| Aggiungere un genere ricaricava la pagina e perdeva i dati | Vedi problemi: nessuna invalidazione in `createTaxonomy`, avviso `beforeunload`. |
| Rimuovere data di recensione e data di inizio | Migrazione `remove_start_and_review_dates`; resta `completed_on` opzionale. |
| Pagina 404 | `NotFoundView` condiviso; 404 sia per il sito sia per l'admin. |
| Le card mostravano una sola console: nasconderla o sostituirla | Le card mostrano "anno · sviluppatore" al posto della piattaforma. |
| Rimuovere note personali, screenshot e artwork | Migrazione `remove_notes_and_extra_images`; form e dati semplificati. |
| Pagina About su di me | `src/content/about.ts` + `AboutView` con tab EN/IT, riquadro "In breve" e citazione finale. |
| Aggiungere Rainbow Six: Siege ai giochi che hanno fatto la sua storia | Aggiunto al paragrafo e al riquadro, in entrambe le lingue. |
| Link al profilo Steam | Nella pagina About e nel footer; aperto in una nuova scheda. |
| Niente scrollbar nei grafici delle statistiche | Vedi sotto. |
| "Completed" e "Reviewed" non hanno più senso: ogni gioco è già completato e recensito | Tolti dalla home e da Statistics perché ripetevano il numero dei giochi. Home: giochi, ore giocate, voto medio, voto più alto. Statistics: giochi giocati, voto medio, ore giocate. |
| Qualche icona carina con `lucide-react` | Icone discrete in home, Statistics, scheda del gioco, badge Online, stati vuoti, pagine di errore/404 e About. Nessuna nel menu e nel footer. |
| L'icona di Steam | Logo preso da Simple Icons (CC0) e usato davanti al link al profilo Steam in About e nel footer. |
| Si usano più launcher (Steam, Ubisoft Connect, EA, Battle.net) e anche giochi Nintendo | Nuovo campo "Launcher" per gioco (migrazione `launchers`, tutti i giochi esistenti su Steam), con icone su card, lista e scheda, filtro in libreria e selezione nel form. Nintendo resta gestito dalle piattaforme. |
| "Where did I play it" meglio di "Launchers"? | Nella scheda pubblica l'etichetta è "Played via" (si legge come una frase e non si confonde con le piattaforme); nel form e nei filtri resta "Launcher". L'interfaccia resta solo in inglese: sono bilingui solo recensioni e About. |
| La colonna destra accanto alla recensione è troppo vuota | Diventa la scheda "My playthrough", sticky: voto in grande, completamento con data, ore, "Played via". I pro e i contro restano sotto la recensione, su richiesta. Le piattaforme sono rimaste nei dettagli del gioco, perché nei dati sono quelle su cui il gioco esce e non dove è stato giocato ("Played on" sarebbe stato fuorviante). |
| Voto, completamento e ore comparivano due volte (in alto e nella barra laterale) | La barra laterale ("My playthrough") mostra solo ciò che in alto non c'è: data di completamento, "Played via" e tag (spostati dall'alto). Se non c'è nulla da mostrare, la colonna sparisce. |
| "Parti da un gioco esistente" sembrava non copiare nulla | Non riprodotto: con "Call of Duty: Black Ops" i campi si compilano sia in sviluppo sia in produzione, anche tornando al form dal menu o dopo "Add and add another". Il segnale però era debole, perché i campi copiati stanno molto più in basso nella pagina. Ora il box elenca cosa è stato copiato e ha il pulsante "Show me". |
| I giochi online non si possono finire e non hanno una data di completamento | Per un gioco online il form nasconde livello e data di completamento e offre solo Playing / On hold / Dropped; stessa regola nella validazione sul server; nel sito pubblico il completamento non compare. Nei test il gioco principale ora è un gioco normale e quello online è il secondo, creato e poi eliminato. |
| Il rank per i giochi online, più un valore "Nessuno" | Nuovo campo "Rank reached" (solo giochi online) con scelte rapide e "None" per i giochi senza classifica; compare nella scheda del gioco al posto del completamento. L'etichetta è in inglese come il resto dell'interfaccia. Migrazione `online_rank`. |
| Una sezione sugli interessi nell'About, e via il ":D" dalla frase finale | Nuova sezione "Beyond the games" / "Oltre i videogiochi" in `about.ts` (nerd culture, lavoro da AI-Assisted Software Developer, fitness), in entrambe le lingue. Non si dice di essere "acculturato" nei videogiochi, su indicazione del proprietario. Il ":D" è stato tolto. Aggiunta anche la frase sul sogno, da ragazzino, di fare il recensore/critico (in "Why this place exists"). |
| "Recently added" solo con i giochi degli ultimi 7 giorni | Lo scaffale della home filtra per data di inserimento (`RECENT_DAYS = 7`) e sparisce se non c'è nulla di recente. Oggi tutti i giochi sono stati aggiunti da poco, quindi non si nota ancora. |
| Icone social e Steam nel footer, in un posto a parte | Nuova riga "Find me elsewhere" con Steam, Instagram, AniList e inLumine (`content/links.ts`); Steam è uscita dalla riga dei link del sito. Il link ad AniList è la home del sito, non un profilo. |
| Togliere "Latest reviews" dalla home | Tolto lo scaffale, che mostrava gli stessi giochi di "Recently added" perché ogni gioco ha una recensione. Le recensioni restano nella pagina Reviews. Nell'About "By trade" è diventato "I work as", più diretto. |
| Revisione generale dell'inglese e dell'italiano del sito | Controllati tutti i testi visibili (pagine, form, messaggi, About in EN e IT). Corretti: nell'About "up to the 3" → "up to the PS3", "wide" → "wide-ranging", "every modern technology" → "all modern technology"; la statistica non parla più di date di inizio (non esistono più); la finestra di eliminazione non cita più "immagini caricate"; due ritocchi minori di grammatica e punteggiatura nei form e nella pagina di errore; il messaggio di setup parla di "migrations". L'italiano non aveva errori da correggere. |
| "Surprise me" deve portare ogni volta a un titolo diverso | Prima sceglieva a caso e poteva ripetersi. Ora un cookie con gli ultimi 30 giochi proposti li esclude, e la risposta non viene mai messa in cache. |
| Un'immagine di anteprima per le varie sezioni del sito | Immagini Open Graph generate per home, Library, Reviews, Statistics, About, ogni gioco (con la sua copertina) e ogni sviluppatore, nello stile del sito; la pagina del gioco usa quella generata al posto della sola copertina. Test: ogni sezione dichiara un PNG 1200×630 diverso dalle altre. |
| Un carosello di recensioni dei giochi di punta, con voto superiore a 9, al massimo 5 | Nuovo carosello in home con le recensioni dei giochi con voto 9 o più, al massimo 5. Si è usato "9 o più" (e non "strettamente più di 9") perché il voto più alto oggi è 9.0 e il carosello sarebbe vuoto. Il vecchio "Standout" automatico non c'è più; "Featured" resta solo se scelto a mano. |
| Le copertine con proporzioni diverse venivano tagliate (es. il titolo di Castle Crashers) | Se le proporzioni non sono (quasi) 3:4 l'immagine intera viene ridotta nel riquadro, con i lati riempiti da una copia sfocata e scurita; l'anteprima nel form mostra lo stesso risultato. Test: un'immagine 1:2 con una fascia rossa in alto e una blu in basso le conserva entrambe. Le copertine già caricate non cambiano (l'originale non è conservato) e vanno ricaricate. |
| La home sembra scarna | Aggiunti "Browse by genre", lo scaffale "Lowest rated" (The blunt truth), il pulsante "Surprise me" e la striscia "Who's behind the reviews". Nota: "Latest reviews" e "Recently added" mostrano oggi gli stessi giochi, perché ogni gioco ha una recensione. |
| Cliccando uno sviluppatore si apre una pagina con tutti i suoi giochi | Nuova pagina `/developers/[slug]`; i nomi sono link su card, lista, gioco in evidenza e scheda del gioco. Gestiti anche i giochi con più sviluppatori. |
| "Playing now" non serve: i giochi si aggiungono solo a gioco finito | Rimossi il numero "Playing now" (home e Statistics) e lo scaffale "Currently playing"; in home al suo posto "Reviewed". Lo stato "Playing" resta disponibile nel form e nei filtri. |
| Via anche "Abandoned" dalle statistiche (difficilmente abbandona giochi) | Rimosso il numero "Abandoned" dalla pagina Statistics, che ora mostra quattro numeri: giochi, completati, voto medio, ore. Lo stato "Dropped" resta nel form e nei filtri. |
| Oltre a "Main story", anche "Main story + side quests" | Nuovo valore dell'enum `completion_status` (migrazione `main_story_side_quests`), presente nel form, nei filtri della libreria e nelle schede. |

Dopo la valutazione di un import da Steam, Salvatore ha scelto di **inserire tutto a mano** (nessuna integrazione
con Steam). Per rendere l'inserimento più rapido sono stati aggiunti, nel form "Nuovo gioco", **"Add and add
another"** e **"Parti da un gioco esistente"** (vedi [04-cms-admin.md](04-cms-admin.md)).

## 4. Problemi incontrati e soluzioni

- **Errori di prerender con `Date.now()` / `new Date()` / `usePathname`**: `connection()` in
  `createClient()` e in `AdminShell`, `Suspense` attorno a `MainNav`, rimosso `new Date()` dalla pagina
  Statistics.
- **Filtri persi con click ravvicinati**: `useQueryParams` conserva l'ultima query in un `ref`.
- **Toast sopra il pulsante fisso "Add game"**: toaster in alto a destra.
- **Bottoni resi come link con ruolo `button`**: nuovo `ButtonLink` e codemod su tutto il progetto.
- **Errore di idratazione sugli id dei campi di ricerca**: id espliciti.
- **Titoli lunghi che sforavano la tabella admin su mobile**: cella che va a capo.
- **Cache da un'ora troppo lunga**: `cacheLife("minutes")`.
- **Test di eliminazione con falso positivo** (navigava prima della fine dell'azione): ora attende il toast.
- **Il form mostrava i dati del gioco precedente**: Next mantiene le pagine visitate (Activity); soluzione con
  `resetForm`, e rimossa la revoca degli URL blob allo smontaggio.
- **Perdita dati aggiungendo un genere**: non riproducibile in locale; ipotesi di disallineamento tra
  deploy Vercel (*deployment skew*). Rimosso `updateTag` da `createTaxonomy` (con commento) e aggiunto
  l'avviso `beforeunload` per modifiche non salvate.
- **Header e footer duplicati nel 404 dentro `(site)`**: `(site)/not-found.tsx` separato + `NotFoundView`.
- **Footer troppo largo su telefono dopo aver aggiunto l'icona di Steam**: i test responsive hanno segnalato lo
  scorrimento orizzontale; la riga dei link ora va a capo (`flex-wrap`).
- **Home che scorreva di lato con due o più recensioni nel carosello**: i testi nascosti (`sr-only`) della
  seconda slide sono posizionati in modo assoluto e il contenitore scorrevole, non essendo `relative`, non li
  tratteneva. Stessa causa dei grafici delle statistiche; ora il contenitore è `relative`. Il test del
  carosello controlla anche questo (con una sola slide il problema non si vede).
- **Overflow orizzontale della pagina Statistics su mobile** (grafico per anno): `min-w-0` sulla sezione e
  `relative` sul contenitore scorrevole.
- **Interruttore "Online" non cliccabile nel test** (colpiva l'input nascosto): `getByRole("switch", …)`.
- **Residui del triangolo nel logo**: soglia alpha e ritaglio al bounding box.
- **Dati di test rimasti nel database**: script di pulizia (`tests/cleanup.ts`), che non tocca mai i giochi veri.
- **Scrollbar verticali nei grafici a colonne** (ultima modifica): il contenitore aveva `overflow-x: auto`,
  che rende automatico anche l'asse verticale, e le barre in altezza percentuale sforavano di pochi pixel.
  Ora la barra vive in una "pista" che occupa lo spazio rimasto, con spazio libero sopra per il valore;
  il contenitore ha `overflow-y: hidden` e nasconde la barra orizzontale (si scorre comunque con il dito
  sugli schermi stretti). Aggiunto un test che impedisce di reintrodurre lo scorrimento verticale.

## 5. Stato attuale

- Typecheck, lint, build e suite Playwright (desktop, mobile, tablet) passano.
- Il database contiene i giochi reali di Salvatore, con copertine; nessun dato di test residuo.
- Ogni push su `master` genera un deploy su Vercel.

## 6. Idee non richieste (disponibili se servono)

- GitHub Actions per eseguire lint, typecheck e test a ogni push.
- Una foto nella pagina About.
- Statistiche separate per i giochi online.
- Rendere il repository privato.
