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
  byGroup: { group: string; amount: number; confirmedAmount: number }[];
}

function isConfirmed(status: Expense['status']): boolean {
  return status === 'paid' || status === 'booked' || status === 'reserved';
}

export function computeBudgetSummary(trip: TripData): BudgetSummary {
  const travellerCount = trip.travellers.length || 1;
  const byCategory = {} as Record<ExpenseCategory, number>;
  const confirmedByCategory = {} as Record<ExpenseCategory, number>;

  let totalTripCost = 0;
  let confirmedTripCost = 0;
  let alreadyPaid = 0;

  for (const exp of trip.expenses) {
    if (!isCounted(exp.status)) continue;
    const amount = expenseTotal(exp, travellerCount);
    totalTripCost += amount;
    byCategory[exp.category] = (byCategory[exp.category] ?? 0) + amount;
    if (exp.status === 'paid') alreadyPaid += amount;
    if (isConfirmed(exp.status)) {
      confirmedTripCost += amount;
      confirmedByCategory[exp.category] = (confirmedByCategory[exp.category] ?? 0) + amount;
    }
  }

  // Fold in accommodation actuals that aren't mirrored in expenses precisely —
  // accommodations are the source of truth for paid/cost, expenses track the rest.
  const remaining = Math.max(totalTripCost - alreadyPaid, 0);
  const remainingConfirmed = Math.max(confirmedTripCost - alreadyPaid, 0);

  const byGroup = Object.entries(EXPENSE_CATEGORY_GROUPS).map(([group, cats]) => ({
    group,
    amount: cats.reduce((sum, c) => sum + (byCategory[c] ?? 0), 0),
    confirmedAmount: cats.reduce((sum, c) => sum + (confirmedByCategory[c] ?? 0), 0),
  }));

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
  };
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
  const settled = trip.bookings.filter((b) => b.status === 'paid' || b.status === 'booked').length;
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

  const mealSavingsPerPerson = acc.hasKitchen
    ? (restaurantBreakfastEstimate - (cookBreakfast?.costPerPerson ?? 3.5)) +
      (restaurantDinnerEstimate - (cookDinner?.costPerPerson ?? 6))
    : 0;
  const mealSavingsPerNight = mealSavingsPerPerson * travellerCount;

  const parkingSavingsPerNight = acc.hasParking ? trip.settings.avgParkingPerDay : 0;

  const effectiveCostPerNight = nightlyRate - mealSavingsPerNight - parkingSavingsPerNight;

  // Weighted score: kitchen(40) + location proxy via walk times(25) + parking(20) + value(15)
  let score = 0;
  const reasoning: string[] = [];

  if (acc.hasKitchen) {
    score += 40;
    reasoning.push('Has a kitchen — the top priority for this trip.');
  } else if (acc.isException) {
    reasoning.push(`No kitchen, but flagged as a deliberate exception: ${acc.exceptionReason ?? 'exceptional value.'}`);
  } else {
    reasoning.push('No kitchen — scores lower on the top priority.');
  }

  const walkScore =
    acc.nearestSupermarketWalkMin != null
      ? Math.max(25 - acc.nearestSupermarketWalkMin, 0)
      : 12; // neutral if unknown
  score += walkScore;

  if (acc.hasParking) {
    score += 20;
    reasoning.push(`Has parking, saving an estimated ${trip.settings.avgParkingPerDay.toFixed(0)} EUR/night versus street/lot parking.`);
  } else {
    reasoning.push('No on-site parking — factor in nightly parking cost separately.');
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
  const researching = trip.bookings.find((b) => b.status === 'researching');
  if (researching) {
    return { label: `Research: ${researching.label}`, detail: 'Still gathering options.' };
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
