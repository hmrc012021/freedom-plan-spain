set search_path to spain_travel_companion, public;

create table itinerary_day_schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references itinerary_days(id) on delete cascade,
  kind text not null default 'schedule' check (kind in ('schedule', 'tip')),
  time text,            -- e.g. '09:00'; null for tips and untimed items
  label text not null,
  detail text,
  sort_order integer not null default 0
);

alter table itinerary_day_schedule_blocks enable row level security;

create policy "members can read" on itinerary_day_schedule_blocks
  for select using (exists (
    select 1 from itinerary_days d
    where d.id = itinerary_day_schedule_blocks.day_id and can_read_trip(d.trip_id)
  ));

create policy "editors can write" on itinerary_day_schedule_blocks
  for all using (exists (
    select 1 from itinerary_days d
    where d.id = itinerary_day_schedule_blocks.day_id and can_edit_trip(d.trip_id)
  )) with check (exists (
    select 1 from itinerary_days d
    where d.id = itinerary_day_schedule_blocks.day_id and can_edit_trip(d.trip_id)
  ));

grant select, insert, update, delete on itinerary_day_schedule_blocks to authenticated;
