set search_path to spain_travel_companion, public;

do $$
declare
  tbl text;
  child_tables text[] := array[
    'travellers', 'accommodations', 'itinerary_days', 'itinerary_day_checklist_items',
    'transport_legs', 'itinerary_day_transport_legs', 'transport_scenarios',
    'transport_scenario_line_items', 'transport_scenario_notes', 'activities',
    'itinerary_day_activities', 'bookings', 'expenses', 'packing_items',
    'meal_assumptions', 'edit_log'
  ];
begin
  foreach tbl in array child_tables loop
    execute format('alter table spain_travel_companion.%I enable row level security;', tbl);
  end loop;
end $$;

-- Direct trip_id tables: travellers, accommodations, itinerary_days,
-- transport_legs, transport_scenarios, activities, bookings, expenses,
-- packing_items, meal_assumptions, edit_log
do $$
declare
  tbl text;
  direct_tables text[] := array[
    'travellers', 'accommodations', 'itinerary_days', 'transport_legs',
    'transport_scenarios', 'activities', 'bookings', 'expenses',
    'packing_items', 'meal_assumptions', 'edit_log'
  ];
begin
  foreach tbl in array direct_tables loop
    execute format(
      'create policy "members can read" on spain_travel_companion.%I for select using (spain_travel_companion.can_read_trip(trip_id));',
      tbl
    );
    execute format(
      'create policy "editors can write" on spain_travel_companion.%I for all using (spain_travel_companion.can_edit_trip(trip_id)) with check (spain_travel_companion.can_edit_trip(trip_id));',
      tbl
    );
  end loop;
end $$;

-- Nested tables: authorize via their parent's trip_id.
create policy "members can read" on itinerary_day_checklist_items for select
  using (exists (select 1 from itinerary_days d where d.id = day_id and can_read_trip(d.trip_id)));
create policy "editors can write" on itinerary_day_checklist_items for all
  using (exists (select 1 from itinerary_days d where d.id = day_id and can_edit_trip(d.trip_id)))
  with check (exists (select 1 from itinerary_days d where d.id = day_id and can_edit_trip(d.trip_id)));

create policy "members can read" on itinerary_day_transport_legs for select
  using (exists (select 1 from itinerary_days d where d.id = day_id and can_read_trip(d.trip_id)));
create policy "editors can write" on itinerary_day_transport_legs for all
  using (exists (select 1 from itinerary_days d where d.id = day_id and can_edit_trip(d.trip_id)))
  with check (exists (select 1 from itinerary_days d where d.id = day_id and can_edit_trip(d.trip_id)));

create policy "members can read" on itinerary_day_activities for select
  using (exists (select 1 from itinerary_days d where d.id = day_id and can_read_trip(d.trip_id)));
create policy "editors can write" on itinerary_day_activities for all
  using (exists (select 1 from itinerary_days d where d.id = day_id and can_edit_trip(d.trip_id)))
  with check (exists (select 1 from itinerary_days d where d.id = day_id and can_edit_trip(d.trip_id)));

create policy "members can read" on transport_scenario_line_items for select
  using (exists (select 1 from transport_scenarios s where s.id = scenario_id and can_read_trip(s.trip_id)));
create policy "editors can write" on transport_scenario_line_items for all
  using (exists (select 1 from transport_scenarios s where s.id = scenario_id and can_edit_trip(s.trip_id)))
  with check (exists (select 1 from transport_scenarios s where s.id = scenario_id and can_edit_trip(s.trip_id)));

create policy "members can read" on transport_scenario_notes for select
  using (exists (select 1 from transport_scenarios s where s.id = scenario_id and can_read_trip(s.trip_id)));
create policy "editors can write" on transport_scenario_notes for all
  using (exists (select 1 from transport_scenarios s where s.id = scenario_id and can_edit_trip(s.trip_id)))
  with check (exists (select 1 from transport_scenarios s where s.id = scenario_id and can_edit_trip(s.trip_id)));
