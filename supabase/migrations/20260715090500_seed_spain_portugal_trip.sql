set search_path to spain_travel_companion, public;

insert into trips (id, owner_id, name, currency, departure_date, return_date, fuel_price_per_litre, avg_parking_per_day, contingency_amount, theme)
values ('spain-portugal-2026', null, 'Spain & Portugal', 'EUR', '2026-08-30', '2026-09-12', 1.75, 16, 250, 'system');

insert into travellers (id, trip_id, name, age_label, age, is_youth, is_senior, sort_order) values
  ('a0000000-0000-4000-8000-00000000000a', 'spain-portugal-2026', 'Traveller A', '62', 62, false, true, 0),
  ('a0000000-0000-4000-8000-00000000000b', 'spain-portugal-2026', 'Traveller B', 'Adult', null, false, false, 1),
  ('a0000000-0000-4000-8000-00000000000c', 'spain-portugal-2026', 'Traveller C', '20', 20, false, false, 2),
  ('a0000000-0000-4000-8000-00000000000d', 'spain-portugal-2026', 'Traveller D', '17', 17, true, false, 3),
  ('a0000000-0000-4000-8000-00000000000e', 'spain-portugal-2026', 'Traveller E', '14', 14, true, false, 4);

insert into accommodations (id, trip_id, name, city, check_in, check_out, cost, paid, has_kitchen, has_parking, has_breakfast, cancellation_policy, status, is_exception, exception_reason, needs_optimization, notes) values
  ('b0000000-0000-4000-8000-000000000001', 'spain-portugal-2026', 'Faro — to research', 'Faro', '2026-08-30', '2026-09-02', 0, 0, false, false, false, 'refundable', 'estimated', false, null, false, '3 nights. Not yet booked.'),
  ('b0000000-0000-4000-8000-000000000002', 'spain-portugal-2026', 'Seville — to research', 'Seville', '2026-09-02', '2026-09-04', 0, 0, false, false, false, 'refundable', 'estimated', false, null, false, '2 nights. Not yet booked.'),
  ('b0000000-0000-4000-8000-000000000003', 'spain-portugal-2026', 'Cordoba — needs re-booking', 'Cordoba', '2026-09-04', '2026-09-06', 0, 0, false, false, false, 'refundable', 'cancelled', false, null, true, 'Kitchen preferred. Original booking was cancelled — needs optimization for a replacement with a kitchen.'),
  ('b0000000-0000-4000-8000-000000000004', 'spain-portugal-2026', 'Granada Old Town Hostel', 'Granada', '2026-09-06', '2026-09-08', 160, 160, false, false, false, 'non-refundable', 'booked', true, 'No kitchen, but exceptional value and location for the price — kept as a deliberate exception to the kitchen-first priority rule.', false, '2 nights, 160 EUR total, already booked.'),
  ('b0000000-0000-4000-8000-000000000005', 'spain-portugal-2026', 'Valencia — to research', 'Valencia', '2026-09-09', '2026-09-12', 0, 0, false, false, false, 'refundable', 'estimated', false, null, false, '3 nights (flexible start: 9 or 10 Sep). Not yet booked.');

insert into itinerary_days (id, trip_id, date, city, accommodation_id, notes) values
  ('c0000000-0000-4000-8000-000000000001', 'spain-portugal-2026', '2026-08-30', 'Faro', null, 'Munich → Madrid → Faro. Arrival day.'),
  ('c0000000-0000-4000-8000-000000000002', 'spain-portugal-2026', '2026-08-31', 'Faro', null, 'Faro exploration.'),
  ('c0000000-0000-4000-8000-000000000003', 'spain-portugal-2026', '2026-09-01', 'Faro', null, 'Day trip to Tavira.'),
  ('c0000000-0000-4000-8000-000000000004', 'spain-portugal-2026', '2026-09-02', 'Seville', null, 'Travel Faro → Seville.'),
  ('c0000000-0000-4000-8000-000000000005', 'spain-portugal-2026', '2026-09-03', 'Seville', null, 'Seville full day.'),
  ('c0000000-0000-4000-8000-000000000006', 'spain-portugal-2026', '2026-09-04', 'Cordoba', null, 'Travel Seville → Cordoba. Accommodation cancelled — needs re-booking with kitchen.'),
  ('c0000000-0000-4000-8000-000000000007', 'spain-portugal-2026', '2026-09-05', 'Cordoba', null, 'Cordoba full day.'),
  ('c0000000-0000-4000-8000-000000000008', 'spain-portugal-2026', '2026-09-06', 'Granada', 'b0000000-0000-4000-8000-000000000004', 'Travel Cordoba → Granada.'),
  ('c0000000-0000-4000-8000-000000000009', 'spain-portugal-2026', '2026-09-07', 'Granada', 'b0000000-0000-4000-8000-000000000004', 'Alhambra, 10:00, already booked and paid.'),
  ('c0000000-0000-4000-8000-00000000000a', 'spain-portugal-2026', '2026-09-08', 'Cartagena', null, 'Rental car pickup candidate. Coastal drive Granada → Cartagena → Valencia.'),
  ('c0000000-0000-4000-8000-00000000000b', 'spain-portugal-2026', '2026-09-09', 'Valencia', null, 'Flexible arrival window (9 or 10 Sep).'),
  ('c0000000-0000-4000-8000-00000000000c', 'spain-portugal-2026', '2026-09-10', 'Valencia', null, null),
  ('c0000000-0000-4000-8000-00000000000d', 'spain-portugal-2026', '2026-09-11', 'Valencia', null, null),
  ('c0000000-0000-4000-8000-00000000000e', 'spain-portugal-2026', '2026-09-12', 'Valencia', null, 'Train Valencia → Madrid, flight Madrid → Munich. Both already paid, part of Iberia package.');

insert into transport_legs (id, trip_id, mode, from_city, to_city, leg_date, depart_time, arrive_time, status, notes) values
  ('d0000000-0000-4000-8000-000000000001', 'spain-portugal-2026', 'flight', 'Munich', 'Madrid', '2026-08-30', '07:30', '10:20', 'paid', null),
  ('d0000000-0000-4000-8000-000000000002', 'spain-portugal-2026', 'flight', 'Madrid', 'Faro', '2026-08-30', '11:25', '12:50', 'paid', null),
  ('d0000000-0000-4000-8000-000000000003', 'spain-portugal-2026', 'train', 'Valencia', 'Madrid', '2026-09-12', '15:09', '17:07', 'paid', 'Included in Iberia booking.'),
  ('d0000000-0000-4000-8000-000000000004', 'spain-portugal-2026', 'flight', 'Madrid', 'Munich', '2026-09-12', '20:05', '22:40', 'paid', null);

insert into itinerary_day_transport_legs (day_id, leg_id) values
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-00000000000e', 'd0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-00000000000e', 'd0000000-0000-4000-8000-000000000004');

insert into activities (id, trip_id, name, city, activity_date, activity_time, status, cost_adult, cost_youth, total_cost, paid, has_youth_discount, has_senior_discount, notes) values
  ('e0000000-0000-4000-8000-000000000001', 'spain-portugal-2026', 'Tavira day trip', 'Tavira', '2026-09-01', null, 'planned', null, null, null, false, false, false, 'Day trip from Faro.'),
  ('e0000000-0000-4000-8000-000000000002', 'spain-portugal-2026', 'Alhambra', 'Granada', '2026-09-07', '10:00', 'booked', 85.27, 14.85, 100.12, true, true, false, 'Already booked and paid. 100.12 EUR total.'),
  ('e0000000-0000-4000-8000-000000000003', 'spain-portugal-2026', 'Seville Cathedral', 'Seville', null, null, 'idea', null, null, null, false, false, false, null),
  ('e0000000-0000-4000-8000-000000000004', 'spain-portugal-2026', 'Royal Chapel', 'Granada', null, null, 'idea', null, null, null, false, false, true, null),
  ('e0000000-0000-4000-8000-000000000005', 'spain-portugal-2026', 'Cartuja Monastery', 'Granada', null, null, 'idea', null, null, null, false, false, false, null),
  ('e0000000-0000-4000-8000-000000000006', 'spain-portugal-2026', 'Sacromonte caves', 'Granada', null, null, 'idea', null, null, null, false, false, false, null),
  ('e0000000-0000-4000-8000-000000000007', 'spain-portugal-2026', 'Carmen de los Mártires', 'Granada', null, null, 'idea', null, null, null, false, false, false, null),
  ('e0000000-0000-4000-8000-000000000008', 'spain-portugal-2026', 'Flamenco show', 'Seville', null, null, 'idea', null, null, null, false, false, false, 'Consider Seville or Granada (Sacromonte).'),
  ('e0000000-0000-4000-8000-000000000009', 'spain-portugal-2026', 'Beach afternoon', 'Faro', null, null, 'idea', null, null, null, false, false, false, null);

insert into itinerary_day_activities (day_id, activity_id) values
  ('c0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000002');

insert into transport_scenarios (id, trip_id, name, description, driving_time_hrs, distance_km, flexibility_score, convenience_score, vehicle_min_seats, vehicle_min_luggage, vehicle_warning, sort_order) values
  ('f0000000-0000-4000-8000-000000000001', 'spain-portugal-2026', 'Public transport', 'Trains and buses between every city, no rental car at any point.', 0, null, 2, 3, null, null, null, 0),
  ('f0000000-0000-4000-8000-000000000002', 'spain-portugal-2026', 'Car from Seville', 'Pick up a rental in Seville, keep it through Cartagena, drop in Valencia.', 9, 620, 5, 4, 5, 5, 'Compact car NOT suitable — need a minivan or 7-seater for 5 travellers plus luggage.', 1),
  ('f0000000-0000-4000-8000-000000000003', 'spain-portugal-2026', 'Car from Granada', 'Public transport Faro–Seville–Cordoba–Granada, rental only in Granada for the coastal leg.', 5, 330, 4, 4, 5, 5, 'Compact car NOT suitable — need a minivan or 7-seater for 5 travellers plus luggage.', 2),
  ('f0000000-0000-4000-8000-000000000004', 'spain-portugal-2026', 'Separate rentals', 'A short rental for Granada → Cartagena → Valencia only, everything else on rail.', 5, 330, 4, 3, 5, 5, null, 3),
  ('f0000000-0000-4000-8000-000000000005', 'spain-portugal-2026', 'User-defined', 'Blank scenario — add your own line items to compare against the others.', null, null, 3, 3, null, null, null, 4);

insert into transport_scenario_line_items (scenario_id, label, amount, sort_order) values
  ('f0000000-0000-4000-8000-000000000001', 'Rail/bus tickets (5 travellers × legs)', 620, 0),
  ('f0000000-0000-4000-8000-000000000002', 'Rental (7 days, 7-seater)', 490, 0),
  ('f0000000-0000-4000-8000-000000000002', 'Fuel', 180, 1),
  ('f0000000-0000-4000-8000-000000000002', 'Parking (avg/night)', 96, 2),
  ('f0000000-0000-4000-8000-000000000002', 'One-way drop fee', 120, 3),
  ('f0000000-0000-4000-8000-000000000002', 'Insurance (full)', 140, 4),
  ('f0000000-0000-4000-8000-000000000003', 'Rail/bus tickets (Faro–Seville–Cordoba–Granada)', 340, 0),
  ('f0000000-0000-4000-8000-000000000003', 'Rental (4 days, 7-seater)', 310, 1),
  ('f0000000-0000-4000-8000-000000000003', 'Fuel', 110, 2),
  ('f0000000-0000-4000-8000-000000000003', 'Parking (avg/night)', 32, 3),
  ('f0000000-0000-4000-8000-000000000003', 'One-way drop fee', 95, 4),
  ('f0000000-0000-4000-8000-000000000003', 'Insurance (full)', 90, 5),
  ('f0000000-0000-4000-8000-000000000004', 'Rail/bus tickets (Faro–Seville–Cordoba–Granada)', 340, 0),
  ('f0000000-0000-4000-8000-000000000004', 'Short rental (2 days, 7-seater)', 165, 1),
  ('f0000000-0000-4000-8000-000000000004', 'Fuel', 70, 2),
  ('f0000000-0000-4000-8000-000000000004', 'Parking', 12, 3),
  ('f0000000-0000-4000-8000-000000000004', 'One-way drop fee', 95, 4),
  ('f0000000-0000-4000-8000-000000000004', 'Insurance (full)', 55, 5);

insert into transport_scenario_notes (scenario_id, kind, note, sort_order) values
  ('f0000000-0000-4000-8000-000000000001', 'pro', 'No parking hassle', 0),
  ('f0000000-0000-4000-8000-000000000001', 'pro', 'No driving fatigue', 1),
  ('f0000000-0000-4000-8000-000000000001', 'pro', 'Fixed, predictable cost', 2),
  ('f0000000-0000-4000-8000-000000000001', 'con', 'Least flexible for the coastal Cartagena detour', 0),
  ('f0000000-0000-4000-8000-000000000001', 'con', 'Luggage transfers at every stop', 1),
  ('f0000000-0000-4000-8000-000000000001', 'con', '5 tickets add up fast on shorter hops', 2),
  ('f0000000-0000-4000-8000-000000000002', 'pro', 'Enables the Cartagena coastal drive', 0),
  ('f0000000-0000-4000-8000-000000000002', 'pro', 'One vehicle for the whole southern leg', 1),
  ('f0000000-0000-4000-8000-000000000002', 'pro', 'No luggage transfers between Seville and Valencia', 2),
  ('f0000000-0000-4000-8000-000000000002', 'con', 'Highest one-way fee', 0),
  ('f0000000-0000-4000-8000-000000000002', 'con', 'Parking cost in dense old towns (Cordoba, Granada)', 1),
  ('f0000000-0000-4000-8000-000000000002', 'con', 'Driving fatigue over multiple days', 2),
  ('f0000000-0000-4000-8000-000000000003', 'pro', 'Avoids parking costs in Seville/Cordoba old towns', 0),
  ('f0000000-0000-4000-8000-000000000003', 'pro', 'Shorter rental period lowers insurance and fuel', 1),
  ('f0000000-0000-4000-8000-000000000003', 'pro', 'Still enables the Cartagena detour', 2),
  ('f0000000-0000-4000-8000-000000000003', 'con', 'Still need train/bus tickets for the first leg', 0),
  ('f0000000-0000-4000-8000-000000000003', 'con', 'Two different modes to coordinate', 1),
  ('f0000000-0000-4000-8000-000000000004', 'pro', 'Lowest total rental exposure', 0),
  ('f0000000-0000-4000-8000-000000000004', 'pro', 'Minimizes days paying for a car you are not driving', 1),
  ('f0000000-0000-4000-8000-000000000004', 'con', 'Same coordination overhead as the Granada scenario', 0),
  ('f0000000-0000-4000-8000-000000000004', 'con', 'Short-rental daily rates run higher per day', 1);

insert into bookings (trip_id, label, category, status, cost, booking_date, linked_entity_type, linked_entity_id, confirmation_number) values
  ('spain-portugal-2026', 'Munich → Madrid → Faro (outbound)', 'flight', 'paid', 0, '2026-08-30', null, null, null),
  ('spain-portugal-2026', 'Madrid → Munich (return, incl. Valencia–Madrid train)', 'flight', 'paid', 1601.90, '2026-09-12', null, null, 'IBERIA-PKG'),
  ('spain-portugal-2026', 'Alhambra tickets', 'activity', 'paid', 100.12, '2026-09-07', 'activity', 'e0000000-0000-4000-8000-000000000002', null),
  ('spain-portugal-2026', 'Granada Old Town Hostel', 'accommodation', 'paid', 160, '2026-09-06', 'accommodation', 'b0000000-0000-4000-8000-000000000004', null),
  ('spain-portugal-2026', 'Faro accommodation', 'accommodation', 'researching', null, null, 'accommodation', 'b0000000-0000-4000-8000-000000000001', null),
  ('spain-portugal-2026', 'Seville accommodation', 'accommodation', 'researching', null, null, 'accommodation', 'b0000000-0000-4000-8000-000000000002', null),
  ('spain-portugal-2026', 'Cordoba accommodation (replacement)', 'accommodation', 'need-booking', null, null, 'accommodation', 'b0000000-0000-4000-8000-000000000003', null),
  ('spain-portugal-2026', 'Valencia accommodation', 'accommodation', 'researching', null, null, 'accommodation', 'b0000000-0000-4000-8000-000000000005', null),
  ('spain-portugal-2026', 'Rental car (scenario dependent)', 'car-rental', 'need-booking', null, null, null, null, null);

insert into expenses (trip_id, label, category, amount, status, refund, expense_date, linked_entity_type, linked_entity_id) values
  ('spain-portugal-2026', 'Iberia package (flights + Valencia train)', 'flights', 1601.90, 'paid', 'non-refundable', '2026-08-30', null, null),
  ('spain-portugal-2026', 'Alhambra tickets', 'museum-tickets', 100.12, 'paid', 'non-refundable', '2026-09-07', 'activity', 'e0000000-0000-4000-8000-000000000002'),
  ('spain-portugal-2026', 'Granada Old Town Hostel', 'accommodation', 160, 'paid', 'non-refundable', '2026-09-06', 'accommodation', 'b0000000-0000-4000-8000-000000000004'),
  ('spain-portugal-2026', 'Faro accommodation (estimate)', 'accommodation', 330, 'estimated', 'refundable', null, 'accommodation', 'b0000000-0000-4000-8000-000000000001'),
  ('spain-portugal-2026', 'Seville accommodation (estimate)', 'accommodation', 240, 'estimated', 'refundable', null, 'accommodation', 'b0000000-0000-4000-8000-000000000002'),
  ('spain-portugal-2026', 'Cordoba accommodation (estimate, needs kitchen)', 'accommodation', 220, 'estimated', 'refundable', null, 'accommodation', 'b0000000-0000-4000-8000-000000000003'),
  ('spain-portugal-2026', 'Valencia accommodation (estimate)', 'accommodation', 360, 'estimated', 'refundable', null, 'accommodation', 'b0000000-0000-4000-8000-000000000005'),
  ('spain-portugal-2026', 'Groceries (kitchen days)', 'groceries', 14, 'estimated', 'refundable', null, null, null),
  ('spain-portugal-2026', 'Restaurants / tapas', 'restaurants', 18, 'estimated', 'refundable', null, null, null),
  ('spain-portugal-2026', 'Coffee & snacks', 'coffee', 4, 'estimated', 'refundable', null, null, null),
  ('spain-portugal-2026', 'Museum & activity tickets (planned)', 'activities', 180, 'estimated', 'refundable', null, null, null),
  ('spain-portugal-2026', 'Mobile data (EU roaming/eSIM)', 'mobile-data', 60, 'estimated', 'non-refundable', null, null, null),
  ('spain-portugal-2026', 'Travel insurance', 'insurance', 145, 'estimated', 'non-refundable', null, null, null),
  ('spain-portugal-2026', 'Incidentals reserve', 'incidentals', 250, 'optional', 'refundable', null, null, null);

insert into packing_items (trip_id, label, category, traveller_id, checked) values
  ('spain-portugal-2026', 'Universal power adapter', 'shared', null, false),
  ('spain-portugal-2026', 'Portable phone charger', 'shared', null, false),
  ('spain-portugal-2026', 'Sunscreen', 'shared', null, false),
  ('spain-portugal-2026', 'First aid kit', 'shared', null, false),
  ('spain-portugal-2026', 'Comfortable walking shoes', 'shared', null, false),
  ('spain-portugal-2026', 'Passport', 'personal', 'a0000000-0000-4000-8000-00000000000a', false),
  ('spain-portugal-2026', 'Passport', 'personal', 'a0000000-0000-4000-8000-00000000000b', false),
  ('spain-portugal-2026', 'Passport', 'personal', 'a0000000-0000-4000-8000-00000000000c', false),
  ('spain-portugal-2026', 'Passport', 'personal', 'a0000000-0000-4000-8000-00000000000d', false),
  ('spain-portugal-2026', 'Passport', 'personal', 'a0000000-0000-4000-8000-00000000000e', false);

insert into meal_assumptions (trip_id, label, category, cost_per_person, frequency, enabled, sort_order) values
  ('spain-portugal-2026', 'Cook breakfast', 'groceries', 3.5, 'daily', true, 0),
  ('spain-portugal-2026', 'Lunch out', 'restaurants', 12, 'daily', true, 1),
  ('spain-portugal-2026', 'Cook dinner', 'groceries', 6, 'daily', true, 2),
  ('spain-portugal-2026', 'Tapas evening', 'restaurants', 16, 'occasional', true, 3),
  ('spain-portugal-2026', 'Premium dinner out', 'restaurants', 32, 'occasional', false, 4),
  ('spain-portugal-2026', 'Coffee & snacks', 'coffee', 4, 'daily', true, 5),
  ('spain-portugal-2026', 'Alcohol', 'alcohol', 5, 'occasional', true, 6);

insert into edit_log (trip_id, summary) values
  ('spain-portugal-2026', 'Trip migrated from JSON-document storage to the normalized spain_travel_companion schema.');
