# CLAUDE.md — Spain & Portugal Trip Companion

Context file for Claude Code (or any future session picking this project back up).
Written after a full migration from a local-only artifact to a Supabase-backed
production app. Read this before making changes — several decisions here look
arbitrary out of context but aren't.

## What this is

A trip-planning web app for a 5-person, ~2-week Spain/Portugal trip (Faro →
Tavira → Seville → Cordoba → Granada → Cartagena → Valencia, Aug 30–Sep 12
2026). Not a spreadsheet, not a static itinerary — it tracks budget, bookings,
accommodation scoring, transport-scenario comparison, activities, and packing,
all backed by a real database instead of localStorage.

## Stack

React 19 + TypeScript + Vite + Tailwind v4 (CSS-first `@theme` tokens, no
config file) + Zustand + React Router + Recharts + Framer Motion + Supabase
(`@supabase/supabase-js`).

## Where the data actually lives

**Supabase project:** "Freedom Plan" (ref `ojwxetjlxqhjtltuycml`, org
`hmrc012021's Org`, region eu-west-3). This is a **shared project** — it also
hosts unrelated apps in their own schemas (`fitness`, `investing`, `mlb` at
minimum, built via separate Claude Code sessions). **Never touch tables
outside `spain_travel_companion` unless explicitly asked.**

Schema: `spain_travel_companion`, 16 tables, fully normalized (this replaced
an earlier single `trips.data jsonb` column — see "History" below). Full DDL
lives in `supabase/migrations/*.sql`, applied in filename order. If you need
to change the schema, add a new migration file rather than editing old ones,
and apply it both to the live project and as a new file.

### Table map

- `trips` — one row per trip. Holds settings (currency, fuel price, parking
  estimate, contingency, theme) directly as columns, not nested JSON.
- `travellers`, `accommodations`, `activities`, `bookings`, `expenses`,
  `packing_items`, `meal_assumptions`, `edit_log` — direct `trip_id` FK.
- `itinerary_days` — one row per calendar day, links to `accommodations` via
  `accommodation_id`.
- `itinerary_day_transport_legs` / `itinerary_day_activities` — junction
  tables linking days to `transport_legs` / `activities` (many-to-many,
  mirrors the original TS model where a leg/activity has its own date *and*
  is referenced by a day's id arrays).
- `transport_scenarios` + `transport_scenario_line_items` +
  `transport_scenario_notes` (kind: pro/con) — the scenario comparison engine.
- `trip_members`, `trip_snapshots` — pre-existing before this migration,
  untouched. `trip_members` drives the RLS ownership model (see below).

Enums (`payment_status`, `booking_status`, `refund_policy`, `transport_mode`,
`activity_status`, `booking_category`, `expense_category`, `meal_frequency`,
`packing_category`, `theme_preference`, `scenario_note_kind`) mirror the
TypeScript union types in `src/types/trip.ts` exactly. If you add a new status
value in TS, you need a migration to `ALTER TYPE ... ADD VALUE` too.

### Deliberate gaps (don't "fix" these without discussing)

- `bookings.linked_entity_id` / `expenses.linked_entity_id` are **soft**
  polymorphic references (uuid + a sibling `linked_entity_type` check
  constraint) — a booking can point at an accommodation, activity, or
  transport leg, so a single FK target isn't possible. Resolved in app code.
- The original TS model had `itineraryStops` (city-level, separate from
  day-level `itineraryDays`). No page ever read it. There is no
  `itinerary_stops` table — `fetchTrip()` just returns `itineraryStops: []`.
  Add a real table if a feature actually needs it.

## Auth & ownership — read this before touching RLS

The `anon` Postgres role has **zero table grants** in this schema (confirmed
via `information_schema.role_table_grants` — true even for the pre-existing
`trips` table, so this was a deliberate choice by whoever originally
scaffolded the schema, not something introduced by this migration). Only
`authenticated` has grants.

This app has no login screen. It calls `supabase.auth.signInAnonymously()` in
`src/lib/supabaseClient.ts` (`ensureSession()`) on boot to get a real
`authenticated` session without building a full auth UI. **This requires
"Allow anonymous sign-ins" to be enabled in the Supabase dashboard**
(Authentication → Sign In / Providers) — it's a project-level toggle, not
something set via SQL/migration.

The seeded trip (`id = 'spain-portugal-2026'`) has `owner_id = null` — an
"unclaimed" trip (there were zero rows in `auth.users` at migration time).
`can_read_trip()` / `can_edit_trip()` (both `security definer` functions,
reused from the pre-existing pattern on `trips`) treat `owner_id is null` as
open to *any* authenticated caller, anonymous session or not. That means
**right now, anyone with anonymous access can edit this trip.**

To lock it down once real accounts exist:
```sql
update spain_travel_companion.trips
set owner_id = '<real-auth-uid>'
where id = 'spain-portugal-2026';
```
After that, `can_edit_trip` only allows that owner or `trip_members` rows —
anonymous sessions get locked out automatically, no code changes needed.

## Architecture (the seam that matters)

```
src/types/trip.ts            Domain model — hasn't changed since the very
                              first artifact version. This is intentional:
                              every page/component is written against this
                              shape, so persistence could change underneath
                              (localStorage → jsonb → normalized tables)
                              without touching page code.
src/types/database.types.ts  Hand-authored Supabase types (see "Known issue"
                              below re: why not generated).
src/lib/supabaseClient.ts    Client pinned to spain_travel_companion schema.
                              ensureSession() = anonymous-auth bootstrap.
src/lib/tripRepository.ts    fetchTrip(tripId) reads all ~16 tables in
                              parallel and reassembles them into the TripData
                              shape. upsertX/insertX/deleteX functions
                              translate store patches back to table writes.
src/store/useTripStore.ts    Zustand store. Every mutator: (1) updates local
                              state optimistically, (2) fires the matching
                              repository write, NOT awaited/rolled back on
                              failure (logged to console only — see
                              "Known tradeoffs"). useTrip() hook asserts
                              non-null trip for page components (only safe
                              because App.tsx gates rendering on load status).
src/pages/*.tsx               One per sidebar section. Barely changed from
                              the original artifact version.
src/lib/accentPreference.ts  Per-device (NOT per-trip) accent color, stored
                              in this browser's localStorage only, applied by
                              overwriting the --color-petrol-* CSS variables
                              at runtime. Intentionally not synced to
                              Supabase — see "Recent changes" below.
supabase/migrations/*.sql    Applied to the live project via Supabase MCP,
                              mirrored here for reproducibility.
```

## Design system

Tailwind v4 CSS-first theme (`src/index.css`, `@theme` block) — no
`tailwind.config.js`. Fonts: Fraunces (display/serif headers), Inter (body),
IBM Plex Mono (all financial figures — `font-mono-num` class, tabular-nums).

Color variable names are historical, not literal — `--color-petrol-*` is the
**primary accent scale**, currently pink (`#FF2D93`) by default, not
petrol-teal (the original color, still available as an accent preset).
Renaming the CSS variables was judged not worth the risk of touching every
component file that references `bg-petrol-500` etc. — if you do a bigger
reskin later, a global rename would be cleaner but isn't required.

`--color-amber-*` / `--color-brick-*` are semantic (warning / danger) and
intentionally were *not* swept into the accent-color system — status colors
shouldn't shift with a user's cosmetic preference.

Signature component: `.flap` CSS class (`src/index.css`) — glossy
near-black-gradient card with a colored top trim, used by `StatCard.tsx` for
the dashboard KPI board (split-flap departure-board motif). Trim color per
card comes from the `tone` prop via a `--flap-trim` CSS variable, not a
solid background fill.

## Known tradeoffs (real, not hypothetical — read before extending)

1. **Writes are optimistic, not transactional.** Store mutators update local
   state immediately; the Supabase write happens async and unawaited. A
   failed write is logged to `console.error`, not surfaced in the UI, not
   retried, not rolled back. Fine for a single-user demo. Would need a
   proper mutation queue + error UI for multi-device reliability.
2. **Import/Reset (`Settings → Import/Reset`) don't write through to
   Supabase.** They replace in-memory state only. A JSON import that should
   persist would need a dedicated bulk-upsert endpoint across ~16 tables —
   deliberately out of scope so far.
3. **No realtime.** Two open tabs/devices won't see each other's edits
   without a manual refresh. Supabase Realtime subscriptions are the natural
   next step if collaborative editing matters.
4. **`database.types.ts` is hand-authored, not generated.** The project's
   PostgREST schema-cache endpoint (`PGRST002`, "Could not query the database
   for the schema cache") was flaky when `supabase gen types` was attempted —
   looked transient (DB itself was healthy throughout via direct SQL), not a
   real schema problem. Verify before trusting blindly:
   `npx supabase gen types typescript --project-id ojwxetjlxqhjtltuycml --schema spain_travel_companion`
5. **Bookings/Expenses "linked_entity" is soft, not FK-enforced** (see
   schema notes above) — a dangling reference is possible if a linked
   accommodation/activity is deleted. No cascade or cleanup exists yet.
6. **`addExpense`, `addActivity`, and `addPackingItem` insert a client-side
   `uid()` string (e.g. `ex-a1b2c3d`) as the `id` column value, but
   `expenses.id` / `activities.id` / `packing_items.id` are all
   `uuid default gen_random_uuid()`.** Postgres rejects a non-uuid string at
   the type level, so every one of these inserts fails outright — caught only
   by `console.error`, per tradeoff #1, so the item appears added in the UI
   and then silently disappears on refresh. Confirmed via the equivalent bug
   in `insertBooking` (same pattern) while wiring up the booking-add feature;
   fixed there by dropping `id` from the insert payload, letting Postgres
   generate it, and reconciling the store's local id from the returned row
   (see `insertBooking` / `addBooking`). The same fix is needed for
   `insertExpense`, `insertActivity`, and `insertPackingItem` but hasn't been
   applied yet.

## Recent changes (most recent first)

- **Bookings page**: added "Add a booking" form (label, category, cost,
  status, date, confirmation number) and made the cost column editable
  inline — previously the page only supported changing status on
  already-seeded bookings, no way to add new ones or set a cost.
- **Accent color system**: black/white base theme, pink default accent,
  6-preset picker in Settings → Appearance, stored per-device in
  localStorage (`src/lib/accentPreference.ts`), applied via
  `document.documentElement.style.setProperty('--color-petrol-*', ...)`.
  `StatCard` reworked from solid-color-fill KPI cards to glossy
  near-black cards with a colored top trim.
- **Traveller names**: `Settings → Travellers` names are now editable
  inline (previously read-only display). New store action `updateTraveller`,
  new repository function `upsertTraveller`.
- **Stale copy fix**: "stored in your browser's local storage" text in
  Settings and the sidebar footer was leftover from the pre-Supabase
  version and actively wrong — fixed to describe live Supabase persistence.
- **Migration from jsonb to normalized schema**: the whole point of this
  file's existence. See "Where the data actually lives" above.

## Environment

```
VITE_SUPABASE_URL=https://ojwxetjlxqhjtltuycml.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase dashboard → Project Settings → API>
VITE_TRIP_ID=spain-portugal-2026
```
Copy `.env.example` → `.env.local`, fill in the anon key. Vite inlines these
at build time — they are not read at runtime, so a hosting provider needs
them set as *build-time* env vars, not just runtime ones.

## Commands

```bash
npm install
npm run dev      # local dev server, hot reload
npm run build    # tsc -b && vite build -> dist/
npm run preview  # serve the production build locally
```

## Things a future session should probably do next

- Wrap Supabase writes in the store with actual error surfacing (toast/banner)
  instead of console-only logging.
- Decide whether to keep the "unclaimed trip = open to anyone" RLS behavior
  or require claiming ownership before the app is usable at all.
- Consider Realtime subscriptions if this becomes genuinely multi-device.
- Regenerate `database.types.ts` properly once confirmed the PGRST002 issue
  was transient (or find out it wasn't, and dig into why).
