# Project Context

## What this project is
Private World Cup 2026 prediction league web app with live fixtures, leaderboard, casino-style UI, knockout draft, and admin tools — built for a closed friend group.

## Stack
- Frontend: Next.js 15 (App Router), React, Tailwind CSS
- Backend: Supabase (Postgres + Auth + RLS + Edge Functions)
- Deploy: Vercel
- Other: External football data API for live fixtures

## Repo structure
src/
  app/                  # Next.js app router
    (auth)/             # Login / signup routes
    (admin)/            # Admin-only tools
    api/                # API route handlers
    leaderboard/        # Leaderboard page
    fixtures/           # Live fixtures page
    draft/              # Knockout draft
  components/
    ui/                 # Shared UI primitives
    admin/              # Admin-specific components
    game/               # Casino/game UI components
  lib/
    supabase/           # Supabase client (server + browser)
    fixtures/           # Fixture fetching + caching logic
    scoring/            # Prediction scoring logic
  hooks/                # Custom React hooks
supabase/
  migrations/           # All schema changes go here
  functions/            # Edge functions

---

# Rules for Claude

## Scope
- Only read files I explicitly reference or that are directly imported by them
- Never scan the whole repo unprompted
- If you need to understand a module, ask me which file to read — don't guess

## Code style
- No comments unless the logic is genuinely non-obvious
- No console.log left in final code
- Keep functions small and single-purpose
- TypeScript strict mode — no `any`
- Prefer early returns over nested conditionals

## Output
- No preamble, no sign-off, no "here's what I did" summaries unless I ask
- If making multiple changes, list filenames affected at the end only
- When in doubt, write less — I'll ask for more

## Error handling
- If you hit a problem twice with the same approach, stop and tell me — don't loop
- Propose a different strategy instead of retrying the same fix

## Database (Supabase)
- Always use RLS — never bypass it
- Write migrations, not direct table edits
- Check existing schema in `supabase/migrations/` before creating new tables
- Predictions, users, scores, and draft picks all have RLS policies — don't touch these without flagging it

## Environment variables
- Never hardcode secrets or API keys
- Football API key, Supabase URL/anon key all live in `.env.local` and Vercel env panel
- If you need a new env var, flag it explicitly

---

# Project-specific notes

## Auth
- Auth is Supabase Auth (email/magic link) — not NextAuth
- Admin role is determined by a `role` column in the `profiles` table, not a separate auth tier
- All admin routes are protected server-side via middleware

## UI / Visual theme
- Casino-style dark theme — think deep blacks, gold accents, bold typography
- Mobile-first — always design for 375px upward
- Animations should feel cinematic, not generic — no default Tailwind transitions where possible

## Fixtures
- Live fixture data is fetched from an external football API and cached
- Do not call the fixture API directly in components — go through `src/lib/fixtures/`
- Fixture data syncs on a schedule — don't assume it's always real-time

## Scoring
- Correct prediction points by stage: Group Stage 3pts, R16 5pts, QF 8pts, SF 12pts, Final 15pts
- No correct scoreline bonus — result only
- Scoring logic lives in src/lib/scoring/ — never recalculate inline

## Knockout draft
- The draft is a separate feature from regular predictions
- Draft picks are stored in their own table — check `supabase/migrations/` for schema
- Draft order and pick logic are in the draft module — don't duplicate this logic elsewhere

## Leaderboard
- Leaderboard is computed from the scores table, not recalculated on the fly
- Cached/materialised — trigger a recalc via admin tools or edge function, not inline

## This is a private app
- No public signup — users are invited only
- Don't add any public-facing auth flows or open registration
