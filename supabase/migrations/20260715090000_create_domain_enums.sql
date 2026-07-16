-- Applied to project ojwxetjlxqhjtltuycml ("Freedom Plan") via Supabase MCP.
-- Reproduce with: supabase db push  (or run these files in order against psql)

create type spain_travel_companion.payment_status as enum (
  'paid', 'booked', 'reserved', 'estimated', 'optional', 'cancelled'
);

create type spain_travel_companion.booking_status as enum (
  'paid', 'booked', 'reserved', 'estimated', 'optional', 'cancelled', 'researching', 'need-booking'
);

create type spain_travel_companion.refund_policy as enum (
  'refundable', 'non-refundable', 'partial'
);

create type spain_travel_companion.transport_mode as enum (
  'flight', 'train', 'bus', 'car', 'walk', 'taxi'
);

create type spain_travel_companion.activity_status as enum (
  'booked', 'planned', 'idea', 'cancelled', 'need-tickets', 'need-reservation'
);

create type spain_travel_companion.booking_category as enum (
  'flight', 'train', 'accommodation', 'activity', 'car-rental', 'other'
);

create type spain_travel_companion.expense_category as enum (
  'flights', 'rail', 'bus', 'rental-car', 'fuel', 'parking', 'tolls',
  'accommodation', 'groceries', 'restaurants', 'coffee', 'alcohol',
  'activities', 'museum-tickets', 'shopping', 'laundry', 'pharmacy',
  'mobile-data', 'insurance', 'incidentals'
);

create type spain_travel_companion.meal_frequency as enum (
  'daily', 'occasional'
);

create type spain_travel_companion.packing_category as enum (
  'shared', 'personal'
);

create type spain_travel_companion.theme_preference as enum (
  'light', 'dark', 'system'
);

create type spain_travel_companion.scenario_note_kind as enum (
  'pro', 'con'
);
