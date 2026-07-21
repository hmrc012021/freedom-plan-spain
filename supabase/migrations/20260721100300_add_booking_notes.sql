set search_path to spain_travel_companion, public;

alter table bookings add column if not exists notes text;
