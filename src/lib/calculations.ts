import type {
  TripData,
  Expense,
  ExpenseCategory,
  TransportScenario,
  Accommodation,
  Booking,
} from '@/types/trip';
import { EXPENSE_CATEGORY_GROUPS } from '@/types/trip';
import { differenceInCalendarDays, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Core money helpers
// ---------------------------------------------------------------------------

export function expenseTotal(expense: Expense, travellerCount: number): number {
  return expense.perTraveller ? expense.amount * travellerCount : expense.amount;
}

export function isCounted(status: Expense['status']): boolean {
  // Cancelled costs never count toward totals.
  return status !== 'cancelled';
}

export interface BudgetGroup {
  group: string;
  amount: number;
  confirmedAmount: number;
  isDaily?: boolean; // flags rows built from a per-person/per-day rate, scaled by travellers × trip length
  isProvisional?: boolean; // flags rows that include a not-yet-booked estimate
}

export interface BudgetSummary {
  totalTripCost: number;
  // "Confirmed" = paid, booked, or reserved — backed by an actual booking rather than a rough estimate.
  confirmedTripCost: number;
  alreadyPaid: number;
  remaining: number;
  remainingConfirmed: number;
  costPerTraveller: number;
  confirmedCostPerTraveller: number;
  byCategory: Record<ExpenseCategory, number>;
  byGroup: BudgetGroup[];
  groundTransportNote: string | null;
}

function isConfirmed(status: Expense['status']): boolean {
  return status === 'paid' || status === 'booked' || status === 'reserved';
}

// A budget entry (an accommodation/activity row, or a pooled category
// estimate like Ground transport/Food) has no status of its own -- it's an
// estimate until a booking links to it. Once linked, the booking's status
// (need-booking/reserved/paid) is what "confirmed" means.
export function isBookingConfirmed(status: Booking['status']): boolean {
  return status !== 'need-booking';
}

export function bookingsFor(trip: TripData, entityId: string): Booking[] {
  return trip.bookings.filter((b) => b.linkedEntityId === entityId);
}

function poolBookings(trip: TripData, categories: Booking['category'][]): Booking[] {
  return trip.bookings.filter((b) => categories.includes(b.category));
}

export interface ReconcileResult {
  forecast: number;
  confirmedAmount: number;
  paidAmount: number;
}

// The core planning-vs-booking rule: an estimate stays the forecast until a
// *confirmed* booking (reserved/paid; need-booking is still just intent,
// doesn't touch the forecast) reconciles against it, per its mode:
// - replace: fully substitutes whatever's left of the estimate with the
//   booking's actual cost (a second booking after a replace has nothing left
//   to reduce, so it just adds on top -- order matters).
// - partial: consumes `reconciledAmount` (defaulting to the booking's own
//   cost) of the *remaining* estimate, then adds the actual cost.
// - additional / unplanned: pure addition, the estimate is never reduced.
// Multiple bookings can reconcile against the same estimate; they're applied
// in array order.
export function reconcileEstimate(estimate: number, bookings: Booking[]): ReconcileResult {
  let forecast = estimate;
  let remainingPlan = estimate;
  let confirmedAmount = 0;
  let paidAmount = 0;

  for (const booking of bookings) {
    if (!isBookingConfirmed(booking.status) || booking.cost == null) continue;
    const actual = booking.cost;
    const mode = booking.reconciliationMode ?? (booking.linkedEntityId ? 'replace' : 'unplanned');

    confirmedAmount += actual;
    if (booking.status === 'paid') paidAmount += booking.paidAmount ?? actual;

    if (mode === 'replace') {
      forecast -= remainingPlan;
      remainingPlan = 0;
      forecast += actual;
    } else if (mode === 'partial') {
      const reduction = Math.min(Math.max(booking.reconciledAmount ?? actual, 0), remainingPlan);
      remainingPlan -= reduction;
      forecast -= reduction;
      forecast += actual;
    } else {
      // additional or unplanned: pure addition, estimate untouched
      forecast += actual;
    }
  }

  return { forecast: Math.max(forecast, 0), confirmedAmount, paidAmount };
}

// Per-item budget entry (accommodation/activity): reconciles its estimate
// against every booking linked to it (not just one -- a stay can have a
// deposit booking and a balance booking, for example).
function itemLine(trip: TripData, itemId: string, estimate: number) {
  const { forecast, confirmedAmount, paidAmount } = reconcileEstimate(estimate, bookingsFor(trip, itemId));
  return { amount: forecast, confirmedAmount, paidAmount };
}

// Pooled budget entry (Food): one estimate for the whole category; any
// confirmed booking in that category reconciles against it the same way.
function pooledLine(trip: TripData, categories: Booking['category'][], estimate: number) {
  const { forecast, confirmedAmount, paidAmount } = reconcileEstimate(estimate, poolBookings(trip, categories));
  return { amount: forecast, confirmedAmount, paidAmount, isEstimate: confirmedAmount === 0 };
}

// Ground transport: only the explicitly *selected* scenario feeds the
// budget (never the cheapest-recommended one automatically). Each of its
// line items is its own estimate, reconciled against bookings linked to
// that specific line item. A ground-transport-category booking that isn't
// linked to a selected-scenario line item (unplanned, or linked elsewhere)
// has no estimate to reconcile against, so it's a pure addition.
function groundTransportLine(trip: TripData) {
  const selected = trip.transportScenarios.find((s) => s.isSelected);
  if (!selected) return { amount: 0, confirmedAmount: 0, paidAmount: 0, selected: undefined as TransportScenario | undefined };

  let amount = 0;
  let confirmedAmount = 0;
  let paidAmount = 0;

  for (const item of selected.lineItems) {
    const itemBookings = item.id
      ? trip.bookings.filter((b) => b.linkedEntityType === 'transport_scenario_line_item' && b.linkedEntityId === item.id)
      : [];
    const r = reconcileEstimate(item.amount, itemBookings);
    amount += r.forecast;
    confirmedAmount += r.confirmedAmount;
    paidAmount += r.paidAmount;
  }

  const linkedLineItemIds = new Set(selected.lineItems.map((li) => li.id).filter((id): id is string => id != null));
  const otherGroundBookings = trip.bookings.filter(
    (b) =>
      (b.category === 'train' || b.category === 'bus' || b.category === 'car-rental') &&
      isBookingConfirmed(b.status) &&
      b.cost != null &&
      !(b.linkedEntityType === 'transport_scenario_line_item' && b.linkedEntityId && linkedLineItemIds.has(b.linkedEntityId))
  );
  for (const b of otherGroundBookings) {
    amount += b.cost!;
    confirmedAmount += b.cost!;
    if (b.status === 'paid') paidAmount += b.paidAmount ?? b.cost!;
  }

  return { amount, confirmedAmount, paidAmount, selected };
}

export function computeBudgetSummary(trip: TripData): BudgetSummary {
  const travellerCount = trip.travellers.length || 1;
  const byCategory = {} as Record<ExpenseCategory, number>;
  const confirmedByCategory = {} as Record<ExpenseCategory, number>;

  let expensePaid = 0;

  for (const exp of trip.expenses) {
    if (!isCounted(exp.status)) continue;
    const amount = expenseTotal(exp, travellerCount);
    byCategory[exp.category] = (byCategory[exp.category] ?? 0) + amount;
    if (exp.status === 'paid') expensePaid += amount;
    if (isConfirmed(exp.status)) {
      confirmedByCategory[exp.category] = (confirmedByCategory[exp.category] ?? 0) + amount;
    }
  }

  // Airfare and Miscellaneous stay freeform-expense-driven -- out of scope
  // for the budget-entry/booking model below.
  const airfare: BudgetGroup = {
    group: 'Airfare',
    amount: EXPENSE_CATEGORY_GROUPS.Airfare.reduce((sum, c) => sum + (byCategory[c] ?? 0), 0),
    confirmedAmount: EXPENSE_CATEGORY_GROUPS.Airfare.reduce((sum, c) => sum + (confirmedByCategory[c] ?? 0), 0),
  };
  const miscellaneous: BudgetGroup = {
    group: 'Miscellaneous',
    amount: EXPENSE_CATEGORY_GROUPS.Miscellaneous.reduce((sum, c) => sum + (byCategory[c] ?? 0), 0),
    confirmedAmount: EXPENSE_CATEGORY_GROUPS.Miscellaneous.reduce((sum, c) => sum + (confirmedByCategory[c] ?? 0), 0),
  };

  // Ground transport: only the explicitly selected scenario feeds the
  // budget -- the cheapest recommendation is shown separately and never
  // auto-selected. No selection means ground transport contributes nothing.
  const scenarioRec = recommendTransportScenario(trip.transportScenarios, travellerCount);
  const recommendedScenario = scenarioRec.results.find((r) => r.scenario.id === scenarioRec.recommendedId);
  const { paidAmount: groundTransportPaid, selected: selectedScenario, ...groundTransport } = groundTransportLine(trip);
  const groundTransportNote = !selectedScenario
    ? recommendedScenario
      ? `No scenario selected yet, so ground transport isn't in the budget. Recommended: "${recommendedScenario.scenario.name}" (${formatCurrencyRaw(recommendedScenario.total)}).`
      : 'No transport scenario selected yet, so ground transport isn’t in the budget.'
    : recommendedScenario && selectedScenario.id !== recommendedScenario.scenario.id
      ? `Using "${selectedScenario.name}" for the working budget. Recommended cheapest: "${recommendedScenario.scenario.name}" (${formatCurrencyRaw(recommendedScenario.total)}).`
      : `Using the recommended "${selectedScenario.name}" scenario for the working budget.`;

  // Accommodation: each row is its own budget entry. Paid tracking stays on
  // accommodations.paid (a real, directly-editable deposit/balance field) --
  // not booking-derived, unlike activities/ground-transport/food below.
  const accommodationLines = trip.accommodations.map((a) => itemLine(trip, a.id, a.cost));
  const accommodationAmount = accommodationLines.reduce((sum, l) => sum + l.amount, 0);
  const accommodationConfirmed = accommodationLines.reduce((sum, l) => sum + l.confirmedAmount, 0);
  const accommodationPaid = trip.accommodations.reduce((sum, a) => sum + a.paid, 0);

  // Activities: same per-item rule -- this also fixes activities.totalCost
  // never having counted toward the budget total at all.
  const activityLines = trip.activities.map((a) => itemLine(trip, a.id, a.totalCost ?? 0));
  const activitiesAmount = activityLines.reduce((sum, l) => sum + l.amount, 0);
  const activitiesConfirmed = activityLines.reduce((sum, l) => sum + l.confirmedAmount, 0);
  const activitiesPaid = activityLines.reduce((sum, l) => sum + l.paidAmount, 0);

  // Meals: the live meal-assumptions engine is the estimate until a real
  // food-category booking exists.
  const mealsEstimate = computeMealBudget(trip, tripDurationDays(trip)).totalTrip;
  const { isEstimate: mealsIsEstimate, paidAmount: mealsPaid, ...meals } = pooledLine(trip, ['food'], mealsEstimate);

  // Transport combines Airfare (freeform, usually booked/paid early) and
  // Ground transport (the scenario comparison) into one category -- they're
  // two different budget mechanisms under the hood, but the same trip concern.
  const transport: BudgetGroup = {
    group: 'Transport',
    amount: airfare.amount + groundTransport.amount,
    confirmedAmount: airfare.confirmedAmount + groundTransport.confirmedAmount,
    isProvisional: !selectedScenario || groundTransport.confirmedAmount < groundTransport.amount,
  };

  const byGroup: BudgetGroup[] = [
    transport,
    { group: 'Accommodation', amount: accommodationAmount, confirmedAmount: accommodationConfirmed },
    { group: 'Meals', ...meals, isDaily: mealsIsEstimate },
    { group: 'Activities', amount: activitiesAmount, confirmedAmount: activitiesConfirmed },
    miscellaneous,
  ];

  const totalTripCost = byGroup.reduce((sum, g) => sum + g.amount, 0);
  const confirmedTripCost = byGroup.reduce((sum, g) => sum + g.confirmedAmount, 0);
  // Bookings marked "paid" are real money spent, same as a paid freeform
  // expense or an accommodation deposit -- count them here too, or "Already
  // Paid" silently loses money the moment a booking (not an expense row)
  // is what's tracking payment for activities/ground-transport/food.
  const alreadyPaid = expensePaid + accommodationPaid + activitiesPaid + groundTransportPaid + mealsPaid;

  const remaining = Math.max(totalTripCost - alreadyPaid, 0);
  const remainingConfirmed = Math.max(confirmedTripCost - alreadyPaid, 0);

  return {
    totalTripCost,
    confirmedTripCost,
    alreadyPaid,
    remaining,
    remainingConfirmed,
    costPerTraveller: totalTripCost / travellerCount,
    confirmedCostPerTraveller: confirmedTripCost / travellerCount,
    byCategory,
    byGroup,
    groundTransportNote,
  };
}

function formatCurrencyRaw(amount: number): string {
  return `€${Math.round(amount).toLocaleString()}`;
}

export function tripDurationDays(trip: TripData): number {
  return Math.max(
    differenceInCalendarDays(parseISO(trip.returnDate), parseISO(trip.departureDate)) + 1,
    1
  );
}

export function expectedDailySpend(trip: TripData): { total: number; confirmed: number } {
  const { totalTripCost, confirmedTripCost } = computeBudgetSummary(trip);
  const days = tripDurationDays(trip);
  return { total: totalTripCost / days, confirmed: confirmedTripCost / days };
}

export function daysUntilDeparture(trip: TripData): number {
  return differenceInCalendarDays(parseISO(trip.departureDate), new Date());
}

// ---------------------------------------------------------------------------
// Booking completion
// ---------------------------------------------------------------------------

export function bookingCompletionPct(trip: TripData): number {
  if (trip.bookings.length === 0) return 0;
  const settled = trip.bookings.filter((b) => isBookingConfirmed(b.status)).length;
  return Math.round((settled / trip.bookings.length) * 100);
}

export function tripProgressPct(trip: TripData): number {
  const total = differenceInCalendarDays(parseISO(trip.returnDate), parseISO(trip.departureDate));
  if (total <= 0) return 0;
  const elapsed = differenceInCalendarDays(new Date(), parseISO(trip.departureDate));
  return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
}

// ---------------------------------------------------------------------------
// Meal budget (live slider calculations)
// ---------------------------------------------------------------------------

export function computeMealBudget(trip: TripData, days: number): { dailyPerPerson: number; totalTrip: number; byLabel: { label: string; amount: number }[] } {
  const travellerCount = trip.travellers.length || 1;
  const byLabel = trip.mealAssumptions
    .filter((m) => m.enabled)
    .map((m) => {
      const occurrences = m.frequency === 'daily' ? days : Math.round(days / 3); // occasional ~ every 3rd day
      const amount = m.costPerPerson * travellerCount * occurrences;
      return { label: m.label, amount };
    });

  const totalTrip = byLabel.reduce((sum, x) => sum + x.amount, 0);
  const dailyPerPerson = totalTrip / (days * travellerCount || 1);

  return { dailyPerPerson, totalTrip, byLabel };
}

// ---------------------------------------------------------------------------
// Accommodation optimization scoring
// Priority order: Kitchen > Location > Parking > Value > Price
// Must weigh meal savings + parking savings, not nightly rate alone.
// ---------------------------------------------------------------------------

export interface AccommodationScore {
  accommodationId: string;
  score: number;
  effectiveCostPerNight: number;
  mealSavingsPerNight: number;
  parkingSavingsPerNight: number;
  reasoning: string[];
}

export function scoreAccommodation(
  acc: Accommodation,
  trip: TripData
): AccommodationScore {
  const nights = Math.max(
    differenceInCalendarDays(parseISO(acc.checkOut), parseISO(acc.checkIn)),
    1
  );
  const nightlyRate = acc.cost / nights;
  const travellerCount = trip.travellers.length || 1;

  // Meal savings: if kitchen available, assume breakfast+dinner cooked vs. eaten out.
  const cookBreakfast = trip.mealAssumptions.find((m) => m.id === 'meal-breakfast-cook');
  const cookDinner = trip.mealAssumptions.find((m) => m.id === 'meal-dinner-cook');
  const premiumDinner = trip.mealAssumptions.find((m) => m.id === 'meal-premium');

  const restaurantBreakfastEstimate = 8; // per person, rough eating-out baseline
  const restaurantDinnerEstimate = premiumDinner?.costPerPerson ?? 22;

  // Unknown (null) amenity availability must never behave like a confirmed
  // "no" -- only a confirmed `true` unlocks the modeled savings.
  const mealSavingsPerPerson = acc.hasKitchen === true
    ? (restaurantBreakfastEstimate - (cookBreakfast?.costPerPerson ?? 3.5)) +
      (restaurantDinnerEstimate - (cookDinner?.costPerPerson ?? 6))
    : 0;
  const mealSavingsPerNight = mealSavingsPerPerson * travellerCount;

  const parkingSavingsPerNight = acc.hasParking === true ? trip.settings.avgParkingPerDay : 0;

  const effectiveCostPerNight = nightlyRate - mealSavingsPerNight - parkingSavingsPerNight;

  // Weighted score: kitchen(40) + location proxy via walk times(25) + parking(20) + value(15)
  let score = 0;
  const reasoning: string[] = [];

  if (acc.hasKitchen === true) {
    score += 40;
    reasoning.push('Has a kitchen — the top priority for this trip.');
  } else if (acc.hasKitchen === false) {
    if (acc.isException) {
      reasoning.push(`No kitchen, but flagged as a deliberate exception: ${acc.exceptionReason ?? 'exceptional value.'}`);
    } else {
      reasoning.push('No kitchen — scores lower on the top priority.');
    }
  } else {
    reasoning.push(
      acc.kitchenRequirement === 'not-required'
        ? 'Kitchen availability not yet confirmed, but not required for this stay.'
        : 'Kitchen availability not yet confirmed — treated as unknown, not a "no."'
    );
  }

  const walkScore =
    acc.nearestSupermarketWalkMin != null
      ? Math.max(25 - acc.nearestSupermarketWalkMin, 0)
      : 12; // neutral if unknown
  score += walkScore;

  if (acc.hasParking === true) {
    score += 20;
    reasoning.push(`Has parking, saving an estimated ${trip.settings.avgParkingPerDay.toFixed(0)} EUR/night versus street/lot parking.`);
  } else if (acc.hasParking === false) {
    reasoning.push('No on-site parking — factor in nightly parking cost separately.');
  } else {
    reasoning.push('Parking availability not yet confirmed.');
  }

  // Value: lower effective cost per night scores higher, normalized against a 120 EUR/night reference.
  const valueScore = Math.max(15 - Math.max(effectiveCostPerNight - 40, 0) / 8, 0);
  score += valueScore;

  reasoning.push(
    `Effective cost after meal/parking savings: ~${effectiveCostPerNight.toFixed(0)} EUR/night (nominal rate ${nightlyRate.toFixed(0)} EUR/night).`
  );

  return {
    accommodationId: acc.id,
    score: Math.round(score),
    effectiveCostPerNight,
    mealSavingsPerNight,
    parkingSavingsPerNight,
    reasoning,
  };
}

// ---------------------------------------------------------------------------
// Transport scenario engine — decision engine with reasoning
// ---------------------------------------------------------------------------

export interface ScenarioResult {
  scenario: TransportScenario;
  total: number;
}

export function scenarioTotal(scenario: TransportScenario): number {
  return scenario.lineItems.reduce((sum, li) => sum + li.amount, 0);
}

export interface ScenarioRecommendation {
  results: ScenarioResult[];
  recommendedId: string | null;
  reasoning: string[];
}

export function recommendTransportScenario(
  scenarios: TransportScenario[],
  travellerCount: number
): ScenarioRecommendation {
  const candidates = scenarios.filter((s) => s.lineItems.length > 0);
  const results = candidates
    .map((s) => ({ scenario: s, total: scenarioTotal(s) }))
    .sort((a, b) => a.total - b.total);

  if (results.length === 0) {
    return { results: [], recommendedId: null, reasoning: ['No scenarios with cost data yet.'] };
  }

  const cheapest = results[0];
  const publicOption = results.find((r) => r.scenario.id === 'sc-public');
  const reasoning: string[] = [];

  reasoning.push(
    `${cheapest.scenario.name} is the lowest total at ${cheapest.total.toFixed(0)} EUR for ${travellerCount} travellers.`
  );

  if (publicOption && publicOption.scenario.id !== cheapest.scenario.id) {
    const delta = publicOption.total - cheapest.total;
    reasoning.push(
      `Public transport would cost ${publicOption.total.toFixed(0)} EUR — ${delta.toFixed(0)} EUR more than ${cheapest.scenario.name}, because ${travellerCount} individual tickets on every leg exceed the combined rental, fuel, and parking cost.`
    );
  }

  if (cheapest.scenario.vehicleRequirement?.warning) {
    reasoning.push(cheapest.scenario.vehicleRequirement.warning);
  }

  if (cheapest.scenario.flexibilityScore >= 4) {
    reasoning.push('Also scores well on flexibility, which matters for the flexible Valencia arrival window.');
  }

  return { results, recommendedId: cheapest.scenario.id, reasoning };
}

// ---------------------------------------------------------------------------
// Booking status → dashboard "next action"
// ---------------------------------------------------------------------------

export function nextAction(trip: TripData): { label: string; detail: string } | null {
  const urgent = trip.bookings.find((b) => b.status === 'need-booking');
  if (urgent) {
    return { label: `Book: ${urgent.label}`, detail: 'Marked as needing a booking.' };
  }
  const needsOptimization = trip.accommodations.find((a) => a.needsOptimization);
  if (needsOptimization) {
    return { label: `Re-optimize: ${needsOptimization.name}`, detail: 'Previous booking was cancelled.' };
  }
  return null;
}

export function bookingStatusCounts(bookings: Booking[]) {
  const counts: Record<string, number> = {};
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  }
  return counts;
}
