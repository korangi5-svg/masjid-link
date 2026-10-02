# masjid-link

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_2dOUaYSO8mDND86mGnLWMDT51sWY)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Backend (Supabase)

Masjid search, maps and prayer times work with no setup (they use OpenStreetMap and Aladhan).
Accounts, events, the contact form and curated listings use [Supabase](https://supabase.com):

1. Create a Supabase project.
2. Create the tables: open **SQL Editor** in the dashboard and run
   [`supabase/migrations/20261001000000_init.sql`](supabase/migrations/20261001000000_init.sql)
   (or `supabase db push` with the Supabase CLI).
3. In **Authentication → URL Configuration**, set **Site URL** to your live domain and add these
   **Redirect URLs** (plus the same paths on `http://localhost:3000` for local development):
   - `https://your-domain/login` (email confirmation)
   - `https://your-domain/reset-password` (password reset)
4. Add the environment variables from [`.env.example`](.env.example) to Vercel
   (**Settings → Environment Variables**) and to `.env.local` for local development, then redeploy.

Once those variables are set, the login button, events and community features appear automatically.

### Fast masjid search (shared cache)

Searches normally depend on the public OpenStreetMap (Overpass) servers, which are often slow. With a secret key
the server saves results in Supabase, so any area searched before (by anyone) loads in well under a second:

1. Run [`supabase/migrations/20261002000000_osm_cache.sql`](supabase/migrations/20261002000000_osm_cache.sql) in the SQL Editor.
2. In Vercel add `SUPABASE_SECRET_KEY` (Project Settings → API Keys → secret key) and `CRON_SECRET`
   (any long random string), both marked **Sensitive**, then redeploy.
3. Preload Canada, the US and the UK once (takes a few minutes): put the same two values plus
   `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, then run `pnpm preload:masjids`.
   Rerun a single region if it fails, e.g. `pnpm preload:masjids us-east`.

A daily Vercel cron job ([`/api/cron/refresh-masjids`](app/api/cron/refresh-masjids/route.ts)) re-imports the
stalest region, so each one is refreshed about weekly. You can also trigger it from Vercel → Settings → Cron Jobs.

Without the secret key, searches still never wait more than ~5 seconds: if Overpass is slow the site answers
with quicker partial results and completes the search in the background.
Contact messages are visible in the dashboard under **Table Editor → contact_messages**.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
