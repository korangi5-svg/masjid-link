# Masjid Link discussion moderation

## What is implemented

- `/discussions`: a public board and single-level replies. Only approved content is public. New content requires a verified Supabase account. Members can see their private posts and review reasons under My posts.
- `/discussions/review`: a server-protected moderator queue showing pending, held, and appealed posts. Moderators can approve or reject with a member-visible reason, revisit automatic approvals, and reconsider rejections. The queue shows parent-post context for replies.
- `/api/discussions`: authenticated posting, moderation, member history, appeals, and moderator decisions. Public responses omit author IDs and private moderation details.
- AI checks for spam, abuse, hostile arguments, and inappropriate content. Clearly safe posts publish automatically. Flagged content stays private; respectful disagreement is explicitly allowed by the classifier instructions.
- A post is saved pending before AI is called. Missing API keys, outages, timeouts, invalid output, low confidence, and incomplete reply context keep it pending. If the final status write fails, the member is told that the post was saved and to check My posts.
- Members can appeal a held or rejected post once. Appeals always go to a human; the AI is not called again.
- Database admission limits: one post per 30 seconds and 20 per day per account, with identical same-day submissions suppressed. Admission is serialized per account before paid AI calls. Moderator updates compare revision numbers, so stale or concurrent actions cannot overwrite decisions.
- Database triggers record every insert and moderation update in `discussion_moderation_events`. These records include status, flags, review reason, reviewer, and appeal state.

The new board is linked from `/learn`. This feature moderates new discussion posts and replies; it does not retrofit moderation into the separate private Q&A, contact form, external social networks, or historical content.

## Activation

1. Apply `supabase/migrations/20261101000000_discussion_moderation.sql` to the site's existing Supabase project using SQL Editor or `supabase db push`. It creates the post table, audit table, trigger, and server-only admission function. It requires the site's existing Supabase auth database and the standard `anon`, `authenticated`, and `service_role` roles.
2. Configure the existing Supabase URL, publishable/anon key, and server-only `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`). The two new tables intentionally have no direct member/anonymous access: all access goes through the server routes.
3. Add server-only `OPENAI_API_KEY` and `MODERATOR_EMAILS` (comma-separated verified account emails). Alternatively, grant `discussion_moderator: true` in trusted Supabase `app_metadata`; user-editable metadata cannot grant access. There is no implicit default moderator.
4. Optionally set `DISCUSSION_MODERATION_MODEL`; the default is `gpt-4.1-mini`. That Responses API call must support strict JSON Schema output. Content safety uses `omni-moderation-latest`.
5. Build and deploy the working copy. Test `/discussions` as a guest and a verified member, then `/discussions/review` as a moderator. Test an appeal, removal of an automatically approved post, and posting with the AI key unavailable. Confirm audit rows in Supabase.

Keep all service/API keys server-only. Do not put any of them in `NEXT_PUBLIC_` variables or commit their values. Post text and up to five earlier thread messages are sent to OpenAI for checks; account IDs, emails, and credentials are omitted. The Responses call uses `store: false`. The posting form discloses this processing. Review your site's privacy notice for this new processing before launch.

## Verification and limits

The automated tests mock OpenAI and Supabase and exercise moderation decisions, private/public access, reviewer permissions, member appeals, stale decisions, AI failures, admission errors, and saved-post recovery. Run:

```sh
node --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

The tests do not execute the migration against a real PostgreSQL server and do not measure model quality. Live database and OpenAI checks require configured services. The confidence cutoff (0.95) is a conservative routing heuristic, not a measured guarantee of accuracy. Calibrate against representative multilingual community posts before depending on automatic approval at scale.

Views show at most 100 posts; the queue lists oldest pending/held posts first so processing drains it. Approved and rejected review views show newest first. Discussions support text only and single-level replies. There is no background retry worker, email notification, attachment filtering, thread locking, or claim of measured moderator time savings. If a thread root is removed, replies under that root are unavailable through the public API. Already fetched pages can retain previously public content until navigation or refresh.

## Official API references

- [OpenAI moderation guide](https://developers.openai.com/api/docs/guides/moderation)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
