# Community matching

`/community` recommends on-site groups using optional matching preferences and saved interests. The directory is linked from the learning library and discussions. Personalization is opt-in. Every field can be omitted. Members can join and leave groups, browse their joined groups, and clear their matching details without losing memberships.

Matching uses city and country (4 points), shared languages (3), shared learning goals (3 each, up to 9), an explicitly chosen age bracket (2), and saved interests (2 each). Reasons appear on each matching card. City matches normalize case and whitespace but do not use geolocation or infer a city. An unspecified city/language/goal never receives a matching bonus. Scores rank the actual directory; they are not compatibility percentages or measures of the people in a group.

Age-specific recommendations require an explicit matching age bracket. Age is never inferred from interests or account names. Previously joined age-specific groups remain visible under My groups after preferences are cleared, allowing a member to leave. Age brackets personalize recommendations; they are self-reported and are not age verification or membership access controls.

Ten new starter circles are seeded in `community_groups`. Their criteria describe the intended circle, not measured demographics of its members. Joining records membership; users use the shared discussion board and learning resources. This release does not include dedicated group rooms, private messages, or public member lists. It does not pair or introduce individual people.

`/api/community` verifies Supabase bearer tokens on every write and uses the authenticated account ID rather than a supplied owner ID. Preferences and memberships are never returned for another account. All three tables have RLS enabled, with anonymous/member table privileges revoked; only server routes with the service key access them. No new external AI provider or API key is required.

The applied Supabase migration is named `community_matching`. Its SQL source is copied in `supabase/schema/community_matching.sql`; migration history is maintained by Supabase's migration tool. Do not run that schema script again on an already configured database. Additional groups can be curated in the table using the existing details schema; only active groups are served, capped at 200 per directory response.

Validation: `node --test tests/*.test.mjs` and `node node_modules/typescript/bin/tsc --noEmit`. Tests cover ranking, missing preferences, opt-out, validation, authenticated ownership, idempotent membership, clearing preferences while retaining membership access, and service failures. A rollback-only database smoke test checks preference and membership persistence without keeping test profile details.
