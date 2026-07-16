# Spain & Portugal Trip Companion — Supabase edition

React + TypeScript + Vite frontend, backed by a normalized PostgreSQL schema
(`spain_travel_companion`) on Supabase project **Freedom Plan** (`ojwxetjlxqhjtltuycml`).
This replaces the earlier single-file-artifact / jsonb-document versions.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the anon key (see below)
npm run dev
```

### Getting the anon key

Supabase dashboard → Freedom Plan → Project Settings → API → copy the
`anon` / `public` key into `.env.local` as `VITE_SUPABASE_ANON_KEY`.

### One required manual step: enable Anonymous Sign-Ins

This app has no login screen yet. It calls `supabase.auth.signInAnonymously()`
on load so the browser gets a real `authenticated` session (see "Auth &
ownership" below for why that's required). Turn this on once:

**Supabase dashboard → Authentication → Sign In / Providers → Anonymous → Enable.**

Without this, `load()` will fail with an explicit error message pointing back here.

## Architecture

```
src/types/trip.ts            domain model (unchanged from the artifact version —
                              this is the seam that let every page keep working)
src/types/database.types.ts  hand-authored types matching supabase/migrations exactly
src/lib/supabaseClient.ts    client pinned to the spain_travel_companion schema,
                              anonymous-auth bootstrap
src/lib/tripRepository.ts    reads all normalized tables in parallel and reassembles
                              them into the nested TripData shape; writes translate
                              patches back to individual table updates
src/store/useTripStore.ts    Zustand store: optimistic local updates + fire-and-forget
                              Supabase writes; useTrip() hook asserts non-null trip
                              for the ~9 page components
src/pages/*.tsx               unchanged from the artifact version
supabase/migrations/*.sql    the exact SQL applied to the live project, in order
```

## Schema

16 tables in `spain_travel_companion`, replacing the original single `trips.data jsonb`
column: `trips`, `travellers`, `accommodations`, `itinerary_days` (+`_checklist_items`),
`transport_legs`, `transport_scenarios` (+`_line_items`, `_notes`), `activities`,
`bookings`, `expenses`, `packing_items`, `meal_assumptions`, `edit_log`, plus junction
tables `itinerary_day_transport_legs` and `itinerary_day_activities`. `trip_members`
and `trip_snapshots` (pre-existing) are unchanged.

Enums (`payment_status`, `booking_status`, `refund_policy`, `transport_mode`,
`activity_status`, `booking_category`, `expense_category`, `meal_frequency`,
`packing_category`, `theme_preference`, `scenario_note_kind`) mirror the TypeScript
union types exactly.

**Schema notes / honest tradeoffs:**
- `bookings.linked_entity_id` and `expenses.linked_entity_id` are soft polymorphic
  references (a booking can point at an accommodation, activity, or transport leg) —
  there's no single FK target, so these are plain `uuid` columns with a sibling
  `linked_entity_type` check constraint, resolved in application code rather than
  by the database.
- The original TypeScript model had an `itineraryStops` array (city-level stops,
  separate from day-level `itineraryDays`). No page component ever actually read it,
  so it wasn't given a table — `fetchTrip()` returns `itineraryStops: []`. If you need
  it later, add an `itinerary_stops` table and populate that field in the repository.
- Every table's RLS mirrors the pattern already established on `trips`
  (`can_read_trip` / `can_edit_trip` helper functions, reused as-is).

## Auth & ownership

The pre-existing `trips` table (and every table added here) grants privileges to
the `authenticated` Postgres role only — `anon` has zero grants, confirmed by
querying `information_schema.role_table_grants`. That's a deliberate, stricter
default that predates this migration; I didn't weaken it.

The seeded trip (`spain-portugal-2026`) has `owner_id = null` — an "unclaimed" trip,
since there were zero rows in `auth.users` at migration time. `can_read_trip` /
`can_edit_trip` treat `owner_id is null` as open to any authenticated caller
(anonymous-session or real-account, doesn't matter). That's why the client signs
in anonymously rather than using the anon key bare.

**Before any real/private use:** claim the trip by setting a real `owner_id`
(`update spain_travel_companion.trips set owner_id = '<uuid>' where id = 'spain-portugal-2026'`),
at which point `can_edit_trip` will only allow that owner (or members you add via
`trip_members`) — anonymous sessions will be locked out automatically, no code
changes needed.

## Known tradeoffs (read before shipping this further)

- **Writes are optimistic and not rolled back on failure.** The store updates
  local state immediately, then fires the Supabase write; if the write fails it's
  logged to the console, not surfaced in the UI or retried. Fine for a single-user
  demo, not fine for multi-device/collaborative use without more work.
- **Import/Reset don't write through.** `importTrip()` (Settings → Import JSON)
  replaces in-memory state only — it doesn't bulk-upsert the normalized tables.
  Persisting an imported snapshot would need a dedicated server-side endpoint
  (transaction across ~16 tables), intentionally out of scope here.
- **No realtime.** Multiple open tabs/devices won't see each other's edits without
  a manual refresh. Supabase Realtime subscriptions would be the natural next step.
- **TypeScript types are hand-authored**, not generated, because the project's
  PostgREST schema-cache endpoint was returning `PGRST002` (retrying) when I
  tried `supabase gen types` — looked transient, not a real schema problem
  (confirmed the DB itself was healthy throughout). Verify against the live
  schema before trusting them blindly:
  `npx supabase gen types typescript --project-id ojwxetjlxqhjtltuycml --schema spain_travel_companion`
- **I could not browser-test the live Supabase calls end-to-end** from this
  environment — my sandbox's own network allowlist blocks `supabase.co`
  (confirmed via `x-deny-reason: host_not_allowed`, not a Supabase-side issue).
  Everything was instead verified at the SQL level directly (row counts, RLS
  function logic under `set role anon`, grants). The build compiles clean.
  **Please do a real smoke test** (`npm run dev`, open it, click around) before
  relying on this.

## Data export

`spain-portugal-2026.json` (delivered alongside this project) is a snapshot
exported directly from the live database via SQL, in the same shape as
`TripData` — use it as a backup or to seed another environment manually.

## Deployment

1. `npm run build` → static `dist/` folder, deployable anywhere (Vercel, Netlify,
   Cloudflare Pages, etc.) as a plain static site.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TRIP_ID` as build-time
   env vars on whatever host you use (they're inlined at build time by Vite, not
   read at runtime).
3. Confirm Anonymous Sign-Ins is enabled (see above) on the target Supabase project
   before going live.
4. Migrations already applied to `ojwxetjlxqhjtltuycml` directly. To reproduce
   on a different project: run the files in `supabase/migrations/` in filename
   order via `supabase db push` or `psql`, then update `.env.local`'s project ref.
