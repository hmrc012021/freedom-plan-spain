-- Applied to project ojwxetjlxqhjtltuycml ("Freedom Plan") via Supabase MCP.
-- Reproduce with: supabase db push  (or run these files in order against psql)
--
-- Ports the "V2" planning/booking-reconciliation model (supplied separately,
-- built against an earlier baseline) into the schema as it stands today
-- after this session's own budget-lifecycle migration
-- (20260717120000_unify_budget_lifecycle.sql). See
-- CLAUDE_HANDOVER_SPAIN_APP_V2.md for the full product spec this implements.

set search_path to spain_travel_companion, public;

-- Planning records must distinguish "not known yet" from a confirmed "no".
alter table accommodations
  add column if not exists kitchen_requirement text not null default 'required'
  check (kitchen_requirement in ('required', 'preferred', 'not-required'));

alter table accommodations
  alter column has_kitchen drop not null,
  alter column has_kitchen drop default,
  alter column has_parking drop not null,
  alter column has_parking drop default,
  alter column has_breakfast drop not null,
  alter column has_breakfast drop default;

-- Unbooked placeholders are unknown, not negative answers. Granada remains the
-- deliberate no-kitchen exception already recorded in the seed data. Verified
-- live before running this: every accommodation row currently has all three
-- amenity flags at the placeholder default `false` (never researched), except
-- Granada's has_kitchen=false, which is a real recorded fact, not a
-- placeholder -- explicitly preserved below, not nulled.
update accommodations
set has_kitchen = null,
    has_parking = null,
    has_breakfast = null,
    kitchen_requirement = 'required'
where trip_id = 'spain-portugal-2026'
  and id <> 'b0000000-0000-4000-8000-000000000004';

update accommodations
set has_kitchen = false,
    kitchen_requirement = 'required'
where id = 'b0000000-0000-4000-8000-000000000004';

-- Scenario comparison remains free-form, but only an explicitly selected
-- scenario feeds the working budget. The default selection below matches
-- today's existing cheapest-recommendation ("Public transport"), so nothing
-- changes for the user until they explicitly pick a different one.
alter table transport_scenarios
  add column if not exists is_selected boolean not null default false;

create unique index if not exists transport_scenarios_one_selected_per_trip_idx
  on transport_scenarios (trip_id)
  where is_selected;

update transport_scenarios
set is_selected = (id = 'f0000000-0000-4000-8000-000000000001')
where trip_id = 'spain-portugal-2026';

-- A booking can fulfil an accommodation, activity, transport leg, or a single
-- line item inside a transport scenario. It can replace, partly fulfil, add to,
-- or sit outside the prior estimate.
alter table bookings drop constraint if exists bookings_linked_entity_type_check;
alter table bookings
  add constraint bookings_linked_entity_type_check
  check (
    linked_entity_type is null
    or linked_entity_type in (
      'accommodation',
      'activity',
      'transport_leg',
      'transport_scenario_line_item'
    )
  );

alter table bookings
  add column if not exists reconciliation_mode text not null default 'unplanned'
  check (reconciliation_mode in ('replace', 'partial', 'additional', 'unplanned')),
  add column if not exists reconciled_amount numeric(10, 2)
  check (reconciled_amount is null or reconciled_amount >= 0);

-- Existing linked accommodation/activity rows were intended to fulfil their
-- corresponding plan records. Unlinked rows remain explicitly unplanned.
update bookings
set reconciliation_mode = 'replace'
where linked_entity_id is not null
  and linked_entity_type in ('accommodation', 'activity');

update bookings
set reconciliation_mode = 'unplanned'
where linked_entity_id is null;

-- This session's earlier migration (20260717120000) added a stricter rule:
-- accommodation/activity bookings always require a link. V2's model allows an
-- explicitly-unplanned accommodation/activity booking (a wholly new cost with
-- no prior estimate) to have no link at all -- relax the rule to match:
-- a link is only required when the booking actually claims to reconcile
-- against something (replace/partial/additional).
alter table bookings drop constraint if exists bookings_linked_required_for_item;
alter table bookings
  add constraint bookings_linked_required_for_item
  check (
    reconciliation_mode = 'unplanned'
    or category not in ('accommodation', 'activity')
    or linked_entity_id is not null
  );
