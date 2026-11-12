# Sviluppo, test e deploy

## Avvio in locale

1. Creare un progetto Supabase e applicare in ordine le migrazioni di `supabase/migrations/`.
2. Disattivare le registrazioni pubbliche e creare l'utente proprietario (il primo utente creato diventa
   `owner`). L'accesso al sito è per username: l'utente auth ha email `<username>@re.local`.
3. Copiare `.env.example` in `.env.local` e compilare:

   | Variabile | Uso |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del progetto Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chiave pubblicabile (anon); la service-role **non** serve |
   | `NEXT_PUBLIC_SITE_URL` | URL pubblico del sito (metadati e link assoluti) |
   | `E2E_USERNAME`, `E2E_PASSWORD` | Credenziali del proprietario, solo per i test Playwright |

4. `npm install && npm run dev`, poi accedere da `/login`.

`.env.local` è ignorato da git (tutti i `.env*` tranne `.env.example`).

## Script

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Server di sviluppo (porta 3000) |
| `npm run build` | Build di produzione (serve Supabase: le pagine si prerenderizzano dal database) |
| `npm start` | Avvia la build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Suite Playwright |

## Controlli automatici (GitHub Actions)

`.github/workflows/ci.yml` gira a ogni push su `master` e a ogni pull request: lint, controllo dei tipi
(`next typegen` + `npm run typecheck`) e `npm run test:unit`, cioè i test che non usano browser, server né
database (`playwright.unit.config.ts`: format, image-formats, library-filter, search-index, validation). Il test
"contro il database vero" salta da solo se mancano le variabili Supabase. La suite completa (`npm run test:e2e`)
usa il database reale e resta sul computer del proprietario.

## Test end-to-end (Playwright)

- File: `tests/{auth,cms,public,responsive}.spec.ts` e gli unit test senza browser (`image-formats`,
  `validation`, `format`, `library-filter`, `search-index`; `library-filter` anche a confronto con il database), con `helpers.ts` e `cleanup.ts`. In tutto 82 test (desktop, mobile e tablet).
- Il materiale promozionale (video di presentazione) sta in `promo/`, ignorato da git perché pesante.
- Tre progetti: **desktop** (tutti i test tranne `responsive`), **mobile** (Pixel 7) e **tablet** (iPad,
  su Chromium), questi ultimi due solo per `responsive.spec.ts`.
- I test girano contro il **Supabase reale**, usando le credenziali del proprietario in `.env.local`
  (`playwright.config.ts` le carica con `process.loadEnvFile`).
- Il server viene avviato da Playwright (`npm run dev`); se la porta è occupata si può scegliere un'altra
  porta con la variabile `PORT`, ad esempio `PORT=3100 npx playwright test`. Se qualcosa risponde già
  sulla porta 3000 (anche un altro progetto), Playwright lo riutilizza: attenzione.
- **Pulizia automatica** (`cleanupE2E()`): i test creano giochi "E2E Game…" e generi "E2E Genre…" e li
  rimuovono alla fine. I giochi reali non vengono mai toccati.

Cosa coprono:

- **auth**: redirect di `/admin` per i visitatori, credenziali errate, form vuoto, accesso e uscita del
  proprietario, scritture anonime respinte dalla RLS.
- **cms**: creazione con copertina e recensioni, nuovo genere senza perdere i dati del form, avviso per
  modifiche non salvate, annullamento senza bozze residue, slug duplicati, presenza del gioco in libreria,
  ricerca e scheda, recensioni nelle due lingue, statistiche, "Parti da un gioco esistente" e "Add and add
  another" (con eliminazione del gioco creato), modifica, sostituzione/rimozione della
  copertina, eliminazione con conferma, 404 dentro l'admin.
- **public**: navigazione tra le sezioni, pagina About (EN/IT e link Steam), 404 (anche per uno sviluppatore
  sconosciuto), filtri nell'URL,
  parametri non validi ignorati.
- **responsive**: nessun overflow orizzontale (anche sulle statistiche), menu mobile, barra filtri,
  grafici senza scrollbar verticale.

## Deploy (Vercel)

- Ogni push su `master` avvia un deploy automatico.
- Variabili d'ambiente richieste su Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Senza di esse la build fallisce
  (è già successo una volta).
- Repository: `salv-ritrovato/re-play` su GitHub.

## Strumenti di sviluppo

- `.mcp.json` configura i server MCP **shadcn** e **playwright** (avviati con `cmd /c npx`).
- `.claude/launch.json` definisce il server di sviluppo `re-dev` (`npm run dev`, porta 3000).
- `AGENTS.md` ricorda che questa versione di Next.js ha differenze rispetto a quella nota: consultare
  `node_modules/next/dist/docs/` prima di modificare API o convenzioni.

## Checklist prima di pubblicare una modifica

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```
