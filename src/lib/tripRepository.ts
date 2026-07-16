import { supabase } from '@/lib/supabaseClient';
import type {
  TripData, Accommodation, Expense, Activity, Booking, TransportScenario,
  TransportLeg, ItineraryDay, PackingItem, MealAssumption, Traveller,
} from '@/types/trip';

// ---------------------------------------------------------------------------
// Read: normalized tables -> the nested TripData shape the UI consumes.
// Fetched in parallel, then assembled client-side. This is the seam that
// lets every existing page/component keep working unmodified even though
// persistence moved from a single jsonb document to ~16 relational tables.
// ---------------------------------------------------------------------------

export async function fetchTrip(tripId: string): Promise<TripData> {
  const [
    tripRes, travellersRes, accRes, daysRes, legsRes, dayLegsRes,
    scenariosRes, lineItemsRes, notesRes, activitiesRes, dayActsRes,
    bookingsRes, expensesRes, packingRes, mealsRes, checklistRes, editLogRes,
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('travellers').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('accommodations').select('*').eq('trip_id', tripId),
    supabase.from('itinerary_days').select('*').eq('trip_id', tripId).order('date'),
    supabase.from('transport_legs').select('*').eq('trip_id', tripId).order('leg_date'),
    supabase.from('itinerary_day_transport_legs').select('*'),
    supabase.from('transport_scenarios').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('transport_scenario_line_items').select('*').order('sort_order'),
    supabase.from('transport_scenario_notes').select('*').order('sort_order'),
    supabase.from('activities').select('*').eq('trip_id', tripId),
    supabase.from('itinerary_day_activities').select('*'),
    supabase.from('bookings').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('*').eq('trip_id', tripId),
    supabase.from('packing_items').select('*').eq('trip_id', tripId),
    supabase.from('meal_assumptions').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('itinerary_day_checklist_items').select('*').order('sort_order'),
    supabase.from('edit_log').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }).limit(50),
  ]);

  for (const [label, res] of Object.entries({
    trip: tripRes, travellers: travellersRes, accommodations: accRes, days: daysRes,
    legs: legsRes, scenarios: scenariosRes, activities: activitiesRes,
    bookings: bookingsRes, expenses: expensesRes, packing: packingRes, meals: mealsRes,
  })) {
    if (res.error) throw new Error(`Failed to load ${label}: ${res.error.message}`);
  }

  const trip = tripRes.data!;
  const scenarioIds = new Set((scenariosRes.data ?? []).map((s) => s.id));

  const travellers: Traveller[] = (travellersRes.data ?? []).map((t) => ({
    id: t.id, name: t.name, ageLabel: t.age_label, age: t.age ?? undefined,
    isYouth: t.is_youth, isSenior: t.is_senior,
  }));

  const accommodations: Accommodation[] = (accRes.data ?? []).map((a) => ({
    id: a.id, name: a.name, city: a.city, address: a.address ?? undefined,
    checkIn: a.check_in, checkOut: a.check_out, cost: Number(a.cost), paid: Number(a.paid),
    hasKitchen: a.has_kitchen, hasParking: a.has_parking, hasBreakfast: a.has_breakfast,
    cancellationPolicy: a.cancellation_policy, bookingSource: a.booking_source ?? undefined,
    confirmationNumber: a.confirmation_number ?? undefined, reviewScore: a.review_score ?? undefined,
    nearestSupermarketWalkMin: a.nearest_supermarket_walk_min ?? undefined,
    nearestParkingWalkMin: a.nearest_parking_walk_min ?? undefined, notes: a.notes ?? undefined,
    status: a.status, isException: a.is_exception, exceptionReason: a.exception_reason ?? undefined,
    needsOptimization: a.needs_optimization,
    location: a.lat != null && a.lng != null ? { name: a.city, lat: a.lat, lng: a.lng, mapsQuery: a.maps_query ?? undefined } : undefined,
  }));

  const transportLegs: TransportLeg[] = (legsRes.data ?? []).map((l) => ({
    id: l.id, mode: l.mode, from: l.from_city, to: l.to_city, date: l.leg_date,
    departTime: l.depart_time ?? undefined, arriveTime: l.arrive_time ?? undefined,
    status: l.status, cost: l.cost ?? undefined, bookingRef: l.booking_ref ?? undefined, notes: l.notes ?? undefined,
  }));

  const transportScenarios: TransportScenario[] = (scenariosRes.data ?? []).map((s) => ({
    id: s.id, name: s.name, description: s.description ?? '',
    lineItems: (lineItemsRes.data ?? []).filter((li) => li.scenario_id === s.id).map((li) => ({ label: li.label, amount: Number(li.amount) })),
    drivingTimeHrs: s.driving_time_hrs ?? undefined, distanceKm: s.distance_km ?? undefined,
    flexibilityScore: s.flexibility_score, convenienceScore: s.convenience_score,
    vehicleRequirement: s.vehicle_min_seats != null ? { minSeats: s.vehicle_min_seats, minLuggage: s.vehicle_min_luggage ?? 0, warning: s.vehicle_warning ?? undefined } : undefined,
    pros: (notesRes.data ?? []).filter((n) => n.scenario_id === s.id && n.kind === 'pro').map((n) => n.note),
    cons: (notesRes.data ?? []).filter((n) => n.scenario_id === s.id && n.kind === 'con').map((n) => n.note),
  })).filter((s) => scenarioIds.has(s.id));

  const activities: Activity[] = (activitiesRes.data ?? []).map((a) => ({
    id: a.id, name: a.name, city: a.city, date: a.activity_date ?? undefined, time: a.activity_time ?? undefined,
    status: a.status, costAdult: a.cost_adult ?? undefined, costYouth: a.cost_youth ?? undefined,
    costSenior: a.cost_senior ?? undefined, totalCost: a.total_cost ?? undefined, paid: a.paid,
    hasSeniorDiscount: a.has_senior_discount, hasYouthDiscount: a.has_youth_discount, notes: a.notes ?? undefined,
  }));

  const itineraryDays: ItineraryDay[] = (daysRes.data ?? []).map((d) => ({
    date: d.date, city: d.city, accommodationId: d.accommodation_id ?? undefined, notes: d.notes ?? undefined,
    transportLegIds: (dayLegsRes.data ?? []).filter((x) => x.day_id === d.id).map((x) => x.leg_id),
    activityIds: (dayActsRes.data ?? []).filter((x) => x.day_id === d.id).map((x) => x.activity_id),
    checklist: (checklistRes.data ?? []).filter((c) => c.day_id === d.id).map((c) => ({ id: c.id, label: c.label, done: c.done })),
  }));

  const bookings: Booking[] = (bookingsRes.data ?? []).map((b) => ({
    id: b.id, label: b.label, category: b.category, status: b.status, cost: b.cost ?? undefined,
    paidAmount: b.paid_amount ?? undefined, linkedEntityId: b.linked_entity_id ?? undefined,
    date: b.booking_date ?? undefined, confirmationNumber: b.confirmation_number ?? undefined,
  }));

  const expenses: Expense[] = (expensesRes.data ?? []).map((e) => ({
    id: e.id, label: e.label, category: e.category, amount: Number(e.amount), perTraveller: e.per_traveller,
    status: e.status, refund: e.refund, date: e.expense_date ?? undefined, notes: e.notes ?? undefined,
    linkedEntityId: e.linked_entity_id ?? undefined,
  }));

  const packingItems: PackingItem[] = (packingRes.data ?? []).map((p) => ({
    id: p.id, label: p.label, category: p.category, travellerId: p.traveller_id ?? undefined, checked: p.checked,
  }));

  const mealAssumptions: MealAssumption[] = (mealsRes.data ?? []).map((m) => ({
    id: m.id, label: m.label, category: m.category, costPerPerson: Number(m.cost_per_person),
    frequency: m.frequency, enabled: m.enabled,
  }));

  const editLog = (editLogRes.data ?? []).map((e) => ({ id: e.id, timestamp: e.created_at, summary: e.summary }));

  return {
    id: trip.id, name: trip.name, departureDate: trip.departure_date ?? '', returnDate: trip.return_date ?? '',
    currency: trip.currency, travellers,
    itineraryStops: [], // derived data, not persisted separately — see README "Schema notes"
    itineraryDays, transportLegs, transportScenarios, accommodations, activities, bookings, expenses,
    packingItems, mealAssumptions,
    settings: {
      currency: trip.currency, fuelPricePerLitre: Number(trip.fuel_price_per_litre),
      avgParkingPerDay: Number(trip.avg_parking_per_day), theme: trip.theme,
      contingencyAmount: Number(trip.contingency_amount),
    },
    editLog,
  };
}

// ---------------------------------------------------------------------------
// Write helpers: one per store mutation, translating camelCase patches back
// to the normalized snake_case columns. Fire-and-forget from the store's
// perspective (optimistic local update happens first); errors are logged
// rather than rolled back to keep the UI snappy -- see README "Known tradeoffs".
// ---------------------------------------------------------------------------

async function logWriteError(label: string, error: { message: string } | null) {
  if (error) console.error(`[tripRepository] ${label} failed:`, error.message);
}

export async function logEdit(tripId: string, summary: string) {
  const { error } = await supabase.from('edit_log').insert({ trip_id: tripId, summary });
  await logWriteError('logEdit', error);
}

export async function upsertTraveller(tripId: string, id: string, patch: { name?: string; ageLabel?: string }) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.ageLabel !== undefined) dbPatch.age_label = patch.ageLabel;
  const { error } = await supabase.from('travellers').update(dbPatch as never).eq('id', id).eq('trip_id', tripId);
  await logWriteError('upsertTraveller', error);
}

export async function upsertAccommodation(tripId: string, acc: Partial<Accommodation> & { id: string }) {
  const patch: Record<string, unknown> = { trip_id: tripId };
  if (acc.name !== undefined) patch.name = acc.name;
  if (acc.cost !== undefined) patch.cost = acc.cost;
  if (acc.paid !== undefined) patch.paid = acc.paid;
  if (acc.status !== undefined) patch.status = acc.status;
  if (acc.hasKitchen !== undefined) patch.has_kitchen = acc.hasKitchen;
  if (acc.hasParking !== undefined) patch.has_parking = acc.hasParking;
  if (acc.hasBreakfast !== undefined) patch.has_breakfast = acc.hasBreakfast;
  const { error } = await supabase.from('accommodations').update(patch as never).eq('id', acc.id);
  await logWriteError('upsertAccommodation', error);
}

export async function upsertExpense(tripId: string, exp: Partial<Expense> & { id: string }) {
  const patch: Record<string, unknown> = {};
  if (exp.label !== undefined) patch.label = exp.label;
  if (exp.category !== undefined) patch.category = exp.category;
  if (exp.amount !== undefined) patch.amount = exp.amount;
  if (exp.status !== undefined) patch.status = exp.status;
  if (exp.refund !== undefined) patch.refund = exp.refund;
  const { error } = await supabase.from('expenses').update(patch as never).eq('id', exp.id).eq('trip_id', tripId);
  await logWriteError('upsertExpense', error);
}

export async function insertExpense(tripId: string, exp: Expense) {
  const { error } = await supabase.from('expenses').insert({
    id: exp.id, trip_id: tripId, label: exp.label, category: exp.category, amount: exp.amount,
    per_traveller: exp.perTraveller ?? false, status: exp.status, refund: exp.refund,
  });
  await logWriteError('insertExpense', error);
}

export async function deleteExpense(tripId: string, id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('trip_id', tripId);
  await logWriteError('deleteExpense', error);
}

export async function upsertActivity(tripId: string, act: Partial<Activity> & { id: string }) {
  const patch: Record<string, unknown> = {};
  if (act.name !== undefined) patch.name = act.name;
  if (act.status !== undefined) patch.status = act.status;
  if (act.paid !== undefined) patch.paid = act.paid;
  const { error } = await supabase.from('activities').update(patch as never).eq('id', act.id).eq('trip_id', tripId);
  await logWriteError('upsertActivity', error);
}

export async function insertActivity(tripId: string, act: Activity) {
  const { error } = await supabase.from('activities').insert({
    id: act.id, trip_id: tripId, name: act.name, city: act.city, status: act.status, paid: act.paid,
  });
  await logWriteError('insertActivity', error);
}

export async function insertBooking(tripId: string, booking: Booking) {
  // bookings.id is `uuid default gen_random_uuid()`, unlike booking.id (a client-side
  // `uid('bk')` string) -- let Postgres generate the real id and hand it back so the
  // caller can reconcile local state, rather than passing a value that fails the column type.
  const { data, error } = await supabase.from('bookings').insert({
    trip_id: tripId, label: booking.label, category: booking.category,
    status: booking.status, cost: booking.cost ?? null, booking_date: booking.date ?? null,
    confirmation_number: booking.confirmationNumber ?? null,
  }).select('id').single();
  await logWriteError('insertBooking', error);
  return data?.id as string | undefined;
}

export async function upsertBooking(tripId: string, id: string, patch: Partial<Booking>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.cost !== undefined) dbPatch.cost = patch.cost;
  if (patch.label !== undefined) dbPatch.label = patch.label;
  if (patch.date !== undefined) dbPatch.booking_date = patch.date;
  if (patch.confirmationNumber !== undefined) dbPatch.confirmation_number = patch.confirmationNumber;
  const { error } = await supabase.from('bookings').update(dbPatch as never).eq('id', id).eq('trip_id', tripId);
  await logWriteError('upsertBooking', error);
}

export async function updateScenarioLineItems(scenarioId: string, lineItems: { label: string; amount: number }[]) {
  const { error: delErr } = await supabase.from('transport_scenario_line_items').delete().eq('scenario_id', scenarioId);
  await logWriteError('updateScenarioLineItems:delete', delErr);
  if (lineItems.length === 0) return;
  const { error } = await supabase.from('transport_scenario_line_items').insert(
    lineItems.map((li, i) => ({ scenario_id: scenarioId, label: li.label, amount: li.amount, sort_order: i }))
  );
  await logWriteError('updateScenarioLineItems:insert', error);
}

export async function togglePackingItem(tripId: string, id: string, checked: boolean) {
  const { error } = await supabase.from('packing_items').update({ checked }).eq('id', id).eq('trip_id', tripId);
  await logWriteError('togglePackingItem', error);
}

export async function insertPackingItem(tripId: string, item: PackingItem) {
  const { error } = await supabase.from('packing_items').insert({
    id: item.id, trip_id: tripId, label: item.label, category: item.category,
    traveller_id: item.travellerId ?? null, checked: item.checked,
  });
  await logWriteError('insertPackingItem', error);
}

export async function deletePackingItem(tripId: string, id: string) {
  const { error } = await supabase.from('packing_items').delete().eq('id', id).eq('trip_id', tripId);
  await logWriteError('deletePackingItem', error);
}

export async function upsertMealAssumption(tripId: string, id: string, patch: Partial<MealAssumption>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.enabled !== undefined) dbPatch.enabled = patch.enabled;
  if (patch.costPerPerson !== undefined) dbPatch.cost_per_person = patch.costPerPerson;
  const { error } = await supabase.from('meal_assumptions').update(dbPatch as never).eq('id', id).eq('trip_id', tripId);
  await logWriteError('upsertMealAssumption', error);
}

export async function updateTripSettings(tripId: string, patch: Partial<TripData['settings']>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.fuelPricePerLitre !== undefined) dbPatch.fuel_price_per_litre = patch.fuelPricePerLitre;
  if (patch.avgParkingPerDay !== undefined) dbPatch.avg_parking_per_day = patch.avgParkingPerDay;
  if (patch.contingencyAmount !== undefined) dbPatch.contingency_amount = patch.contingencyAmount;
  if (patch.theme !== undefined) dbPatch.theme = patch.theme;
  if (patch.currency !== undefined) dbPatch.currency = patch.currency;
  const { error } = await supabase.from('trips').update(dbPatch as never).eq('id', tripId);
  await logWriteError('updateTripSettings', error);
}

export async function toggleDayChecklistItem(id: string, done: boolean) {
  const { error } = await supabase.from('itinerary_day_checklist_items').update({ done }).eq('id', id);
  await logWriteError('toggleDayChecklistItem', error);
}

// ---------------------------------------------------------------------------
// Trip members -- who else (besides the owner) can read/edit this trip.
// Backed by SECURITY DEFINER RPC functions so a plain client can resolve an
// email to a user_id without needing direct access to auth.users.
// ---------------------------------------------------------------------------

export interface TripMember {
  user_id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase.rpc('get_trip_members', { p_trip_id: tripId });
  if (error) throw new Error(error.message);
  return (data ?? []) as TripMember[];
}

export async function addTripMemberByEmail(
  tripId: string,
  email: string,
  role: 'editor' | 'viewer',
): Promise<void> {
  const { error } = await supabase.rpc('add_trip_member_by_email', {
    p_trip_id: tripId,
    p_email: email,
    p_role: role,
  });
  if (error) throw new Error(error.message);
}

export async function removeTripMember(tripId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_trip_member', {
    p_trip_id: tripId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
}
