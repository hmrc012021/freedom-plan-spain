-- Applied to project ojwxetjlxqhjtltuycml ("Freedom Plan") via Supabase MCP.
-- Reproduce with: supabase db push  (or run these files in order against psql)
--
-- Collapses the app's five disconnected money-tracking mechanisms down to one
-- rule: an accommodation/activity row IS the budget entry (its cost is the
-- estimate); once a booking links to it, the booking's real cost supersedes
-- the estimate. accommodations.status / activities.status / activities.paid
-- are dropped -- an item's effective status is now derived from its linked
-- booking (or "not yet booked" if none exists), not stored redundantly.

-- ---------------------------------------------------------------------------
-- Drop now-redundant status/paid fields.
-- ---------------------------------------------------------------------------
alter table spain_travel_companion.accommodations drop column status;
alter table spain_travel_companion.activities drop column status;
alter table spain_travel_companion.activities drop column paid;
drop type spain_travel_companion.activity_status;

-- ---------------------------------------------------------------------------
-- Shrink booking_status from 8 values down to 3 (need-booking, reserved,
-- paid). Postgres can't remove enum values via ALTER TYPE, so swap the
-- column onto a freshly created type instead.
-- ---------------------------------------------------------------------------
delete from spain_travel_companion.bookings where status = 'cancelled';

create type spain_travel_companion.booking_status_new as enum ('need-booking', 'reserved', 'paid');

alter table spain_travel_companion.bookings
  add column status_new spain_travel_companion.booking_status_new;

update spain_travel_companion.bookings set status_new = (case status::text
  when 'paid' then 'paid'
  when 'booked' then 'reserved'
  when 'reserved' then 'reserved'
  when 'researching' then 'need-booking'
  when 'need-booking' then 'need-booking'
end)::spain_travel_companion.booking_status_new;

alter table spain_travel_companion.bookings alter column status_new set not null;
alter table spain_travel_companion.bookings alter column status_new set default 'need-booking';

alter table spain_travel_companion.bookings drop column status;
alter table spain_travel_companion.bookings rename column status_new to status;

drop type spain_travel_companion.booking_status;
alter type spain_travel_companion.booking_status_new rename to booking_status;

-- ---------------------------------------------------------------------------
-- A booking for a specific accommodation/activity must point at one -- the
-- literal implementation of "can't enter a booking without reducing a
-- budget entry." Pooled categories (flight/train/car-rental/other) have no
-- discrete entity to point at, so they stay unconstrained.
-- ---------------------------------------------------------------------------
alter table spain_travel_companion.bookings
  add constraint bookings_linked_required_for_item
  check (category not in ('accommodation', 'activity') or linked_entity_id is not null);
