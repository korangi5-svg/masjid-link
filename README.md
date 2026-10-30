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

## Personalized onboarding

Signup collects account details, then asks members to choose Quran, Tafsir, Islamic History,
Parenting, New Muslims, and/or Youth. At least one interest is required before account creation.
Supabase saves the choices in the signed-in user's Auth metadata (`interests` and
`onboarding_completed`); the existing signup trigger creates their public profile.
Email confirmation remains enabled according to the project's authentication settings.
No database migration or additional secret is required for this feature.

After login or signup confirmation, `/dashboard` shows curated resources matched to saved
interests. Members without completed preferences go to `/onboarding`, which is also available
from My Account and the dashboard to edit interests. Preferences sync across devices through
Supabase Auth, not browser-local storage. Recommendation tags and content live in
`lib/recommendations.ts`. Recommendations use topic matches, without collecting browsing history.

Run the onboarding tests with Node 24+: `node --test tests/onboarding.test.mjs`.

### Adaptive learning recommendations

`/learn` offers searchable lectures, articles, courses, and podcasts. `/dashboard` ranks each
format using onboarding interests, completed content, followed scholars, and searched topics.
Members explicitly enable activity personalization before any history is collected. Clicking an
external resource does not count as reading or watching: members use Mark read/watched/listened/
completed after using the publisher's site. A paused feed uses only onboarding interests.

The engine is content-based ranking, not a trained collaborative model or a generative Islamic
advice system. It never invents content, religious answers, scholar attribution, or destination URLs.
Sources and scholar mappings are curated in `lib/recommendations.ts`.

Activity is stored in `recommendation_activity` in each member's Supabase Auth metadata. All
writes verify the active account; browser writes are queued to avoid lost updates from rapid
actions. No new secrets or database migrations are required. This bounded first version is
appropriate for the small catalogue: concurrent updates from separate devices use last-write-wins.
A larger catalogue should move events to an account-scoped table with row-level security.

At most 32 completion records and 12 topic-search records influence ranking. Events older than
180 days are ignored and removed on the next activity write; raw search text is never saved.
Completed items are hidden from the recommendation rows, but remain in the library for review
or undo. Members can pause collection or clear history and follows without deleting interests.
Recent history decays with a 30-day half-life; repeat completions/searches cannot stack duplicate
weights. The engine adds cold-start and discovery items and explains each recommendation.

Run `node --test tests/onboarding.test.mjs tests/recommendations.test.mjs` (Node 24+).

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

