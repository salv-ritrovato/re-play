# Re — My journey through gaming

A private personal archive of every video game I've played: ratings, reviews, and a visual history.
Public reading, owner-only writing through a built-in CMS.

**Stack:** Next.js (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, Storage) · React Hook Form + Zod · Sonner · Playwright.

## Setup

1. **Create a Supabase project** (the free tier is enough).
2. **Apply the schema:** run `supabase/migrations/20261109120000_init.sql` in the SQL editor
   (or `supabase db push` with the CLI). It creates tables, RLS policies, the `game-media` storage
   bucket, search/statistics views and seeds common genres and platforms.
3. **Disable public sign-ups:** Authentication → Sign In / Providers → turn off *Allow new users to sign up*.
4. **Create the owner:** Authentication → Users → *Add user* (email + password, auto-confirm).
   The first user ever created becomes the `owner` automatically (see `handle_new_user`).
5. **Environment:** copy `.env.example` to `.env.local` and fill in the project URL and the
   publishable (anon) key. The service-role key is **never** used by this app.
6. `npm install && npm run dev`, then sign in at `/login`.

## Architecture notes

- **Public pages** read through a cookie-less anonymous client inside `'use cache'` functions tagged
  `games` / `taxonomy`; CMS server actions call `updateTag` so changes appear immediately.
- **Admin** (`/admin`) is gated three times: `proxy.ts` (optimistic redirect), `requireOwner()` on the
  server, and Row Level Security (`is_owner()`) in Postgres.
- **Images** are compressed twice: in the browser (resize + WebP) before upload, then authoritatively on
  the server with `sharp` (EXIF rotate, metadata stripped, covers cropped to 3:4 at 900×1200, WebP) and
  stored in the public `game-media` bucket, which only accepts `image/webp`. `next/image` then serves
  AVIF/WebP at the right size, with a blur placeholder stored per image.
- **Search / filters / sort / pagination** run in one SQL function, `library_search`, driven by URL params.
- **Statistics** come from SQL views over the real tables (`stats_*`).
- Future metadata providers (IGDB, RAWG…) can plug into the CMS form; manual entry always works.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (needs Supabase env vars: pages prerender from the database) |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright tests |
