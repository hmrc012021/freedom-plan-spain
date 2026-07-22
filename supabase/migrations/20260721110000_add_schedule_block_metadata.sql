set search_path to spain_travel_companion, public;

alter table itinerary_day_schedule_blocks
  add column if not exists priority text check (priority in ('must_not_miss','high','normal','optional','cut_first')),
  add column if not exists audience text not null default 'all' check (audience in ('all','adults','teens','split')),
  add column if not exists flexibility text check (flexibility in ('fixed','semi_fixed','flexible')),
  add column if not exists status text check (status in ('planned','booked','paid','completed','cancelled')),
  add column if not exists occasion text check (occasion in ('birthday','special_meal','celebration')),
  add column if not exists hard_cutoff text;
