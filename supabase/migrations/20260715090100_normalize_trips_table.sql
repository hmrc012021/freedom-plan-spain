-- Allow "unclaimed" seed/demo trips with no owner yet. Trips created through
-- the app's normal insert policy still always set owner_id = auth.uid();
-- this only enables system-seeded trips to exist prior to any user signup.
alter table spain_travel_companion.trips
  alter column owner_id drop not null;

alter table spain_travel_companion.trips
  add column if not exists currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  add column if not exists departure_date date,
  add column if not exists return_date date,
  add column if not exists fuel_price_per_litre numeric(10, 2) not null default 1.75 check (fuel_price_per_litre >= 0),
  add column if not exists avg_parking_per_day numeric(10, 2) not null default 16 check (avg_parking_per_day >= 0),
  add column if not exists contingency_amount numeric(10, 2) not null default 0 check (contingency_amount >= 0),
  add column if not exists theme spain_travel_companion.theme_preference not null default 'system';

alter table spain_travel_companion.trips
  add constraint trips_date_range_chk check (return_date is null or departure_date is null or return_date >= departure_date);

-- The jsonb document and its optimistic-concurrency RPC are the persistence
-- model we are replacing with normalized tables.
drop function if exists spain_travel_companion.update_trip_document(text, integer, text, jsonb);

alter table spain_travel_companion.trips
  drop column data;

-- Unclaimed trips (owner_id is null) have no owner to add as a member.
create or replace function spain_travel_companion.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'spain_travel_companion'
as $function$
begin
    if new.owner_id is not null then
        insert into spain_travel_companion.trip_members (trip_id, user_id, role)
        values (new.id, new.owner_id, 'owner')
        on conflict (trip_id, user_id) do update set role = 'owner';
    end if;
    return new;
end;
$function$;

-- Unclaimed trips (owner_id is null) are treated as open demo trips:
-- readable and editable by any caller until a real owner claims them by
-- setting owner_id. This is a deliberate tradeoff since the app does not
-- yet have an auth UI -- see README "Auth & ownership" section.
create or replace function spain_travel_companion.can_read_trip(p_trip_id text)
returns boolean
language sql
stable security definer
set search_path to 'pg_catalog', 'spain_travel_companion'
as $function$
    select exists (
        select 1
        from spain_travel_companion.trips as t
        where t.id = p_trip_id
          and (
              t.owner_id is null
              or t.owner_id = auth.uid()
              or exists (
                  select 1
                  from spain_travel_companion.trip_members as m
                  where m.trip_id = t.id
                    and m.user_id = auth.uid()
              )
          )
    );
$function$;

create or replace function spain_travel_companion.can_edit_trip(p_trip_id text)
returns boolean
language sql
stable security definer
set search_path to 'pg_catalog', 'spain_travel_companion'
as $function$
    select exists (
        select 1
        from spain_travel_companion.trips as t
        where t.id = p_trip_id
          and (
              t.owner_id is null
              or t.owner_id = auth.uid()
              or exists (
                  select 1
                  from spain_travel_companion.trip_members as m
                  where m.trip_id = t.id
                    and m.user_id = auth.uid()
                    and m.role in ('owner', 'editor')
              )
          )
    );
$function$;

create or replace function spain_travel_companion.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

drop trigger if exists set_trips_updated_at on spain_travel_companion.trips;
create trigger set_trips_updated_at
  before update on spain_travel_companion.trips
  for each row execute function spain_travel_companion.set_updated_at();
