set search_path to spain_travel_companion, public;

create table travellers (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  age_label text not null,
  age int,
  is_youth boolean not null default false,
  is_senior boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index travellers_trip_id_idx on travellers(trip_id);

create table accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  city text not null,
  address text,
  check_in date not null,
  check_out date not null,
  cost numeric(10, 2) not null default 0 check (cost >= 0),
  paid numeric(10, 2) not null default 0 check (paid >= 0),
  has_kitchen boolean not null default false,
  has_parking boolean not null default false,
  has_breakfast boolean not null default false,
  cancellation_policy refund_policy not null default 'refundable',
  booking_source text,
  confirmation_number text,
  review_score numeric(3, 1) check (review_score is null or (review_score >= 0 and review_score <= 10)),
  nearest_supermarket_walk_min int check (nearest_supermarket_walk_min is null or nearest_supermarket_walk_min >= 0),
  nearest_parking_walk_min int check (nearest_parking_walk_min is null or nearest_parking_walk_min >= 0),
  notes text,
  status payment_status not null default 'estimated',
  is_exception boolean not null default false,
  exception_reason text,
  needs_optimization boolean not null default false,
  lat double precision,
  lng double precision,
  maps_query text,
  created_at timestamptz not null default now(),
  check (check_out >= check_in)
);
create index accommodations_trip_id_idx on accommodations(trip_id);

create table itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  date date not null,
  city text not null,
  accommodation_id uuid references accommodations(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (trip_id, date)
);
create index itinerary_days_trip_id_idx on itinerary_days(trip_id);
create index itinerary_days_accommodation_id_idx on itinerary_days(accommodation_id);

create table itinerary_day_checklist_items (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references itinerary_days(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  sort_order int not null default 0
);
create index itinerary_day_checklist_items_day_id_idx on itinerary_day_checklist_items(day_id);

create table transport_legs (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  mode transport_mode not null,
  from_city text not null,
  to_city text not null,
  leg_date date not null,
  depart_time time,
  arrive_time time,
  status payment_status not null default 'estimated',
  cost numeric(10, 2) check (cost is null or cost >= 0),
  booking_ref text,
  notes text,
  created_at timestamptz not null default now()
);
create index transport_legs_trip_id_idx on transport_legs(trip_id);

create table itinerary_day_transport_legs (
  day_id uuid not null references itinerary_days(id) on delete cascade,
  leg_id uuid not null references transport_legs(id) on delete cascade,
  primary key (day_id, leg_id)
);

create table transport_scenarios (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  description text,
  driving_time_hrs numeric(5, 1) check (driving_time_hrs is null or driving_time_hrs >= 0),
  distance_km numeric(7, 1) check (distance_km is null or distance_km >= 0),
  flexibility_score int not null default 3 check (flexibility_score between 1 and 5),
  convenience_score int not null default 3 check (convenience_score between 1 and 5),
  vehicle_min_seats int,
  vehicle_min_luggage int,
  vehicle_warning text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index transport_scenarios_trip_id_idx on transport_scenarios(trip_id);

create table transport_scenario_line_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references transport_scenarios(id) on delete cascade,
  label text not null,
  amount numeric(10, 2) not null default 0,
  sort_order int not null default 0
);
create index transport_scenario_line_items_scenario_id_idx on transport_scenario_line_items(scenario_id);

create table transport_scenario_notes (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references transport_scenarios(id) on delete cascade,
  kind scenario_note_kind not null,
  note text not null,
  sort_order int not null default 0
);
create index transport_scenario_notes_scenario_id_idx on transport_scenario_notes(scenario_id);

create table activities (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  city text not null,
  activity_date date,
  activity_time time,
  status activity_status not null default 'idea',
  cost_adult numeric(10, 2) check (cost_adult is null or cost_adult >= 0),
  cost_youth numeric(10, 2) check (cost_youth is null or cost_youth >= 0),
  cost_senior numeric(10, 2) check (cost_senior is null or cost_senior >= 0),
  total_cost numeric(10, 2) check (total_cost is null or total_cost >= 0),
  paid boolean not null default false,
  has_senior_discount boolean not null default false,
  has_youth_discount boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index activities_trip_id_idx on activities(trip_id);

create table itinerary_day_activities (
  day_id uuid not null references itinerary_days(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  primary key (day_id, activity_id)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  label text not null,
  category booking_category not null,
  status booking_status not null default 'researching',
  cost numeric(10, 2) check (cost is null or cost >= 0),
  paid_amount numeric(10, 2) check (paid_amount is null or paid_amount >= 0),
  -- Soft polymorphic reference: the linked row can live in accommodations,
  -- activities, or transport_legs depending on category, so a single FK
  -- isn't possible. Application layer resolves (linked_entity_type, linked_entity_id).
  linked_entity_type text check (linked_entity_type is null or linked_entity_type in ('accommodation', 'activity', 'transport_leg')),
  linked_entity_id uuid,
  booking_date date,
  confirmation_number text,
  created_at timestamptz not null default now()
);
create index bookings_trip_id_idx on bookings(trip_id);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  label text not null,
  category expense_category not null,
  amount numeric(10, 2) not null default 0,
  per_traveller boolean not null default false,
  status payment_status not null default 'estimated',
  refund refund_policy not null default 'refundable',
  expense_date date,
  notes text,
  linked_entity_type text check (linked_entity_type is null or linked_entity_type in ('accommodation', 'activity', 'transport_leg', 'booking')),
  linked_entity_id uuid,
  created_at timestamptz not null default now()
);
create index expenses_trip_id_idx on expenses(trip_id);

create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  label text not null,
  category packing_category not null,
  traveller_id uuid references travellers(id) on delete cascade,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  check (
    (category = 'personal' and traveller_id is not null)
    or (category = 'shared' and traveller_id is null)
  )
);
create index packing_items_trip_id_idx on packing_items(trip_id);

create table meal_assumptions (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  label text not null,
  category expense_category not null,
  cost_per_person numeric(10, 2) not null default 0 check (cost_per_person >= 0),
  frequency meal_frequency not null default 'daily',
  enabled boolean not null default true,
  sort_order int not null default 0
);
create index meal_assumptions_trip_id_idx on meal_assumptions(trip_id);

create table edit_log (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references trips(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);
create index edit_log_trip_id_idx on edit_log(trip_id, created_at desc);
