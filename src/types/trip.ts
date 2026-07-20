// ---------------------------------------------------------------------------
// Domain models — Spain Trip Companion
// These types are trip-agnostic: a new trip is just a new TripData object,
// never a code change.
// ---------------------------------------------------------------------------

export type Currency = 'EUR' | 'USD' | 'GBP';

export type PaymentStatus =
  | 'paid'
  | 'booked'
  | 'reserved'
  | 'estimated'
  | 'optional'
  | 'cancelled';

export type RefundPolicy = 'refundable' | 'non-refundable' | 'partial';

export interface Traveller {
  id: string;
  name: string;
  ageLabel: string; // "62", "Adult", "20", "17", "14" — kept as label since some are non-numeric
  age?: number;
  isYouth: boolean; // affects discounts
  isSenior: boolean;
}

export type ExpenseCategory =
  | 'flights'
  | 'rail'
  | 'bus'
  | 'rental-car'
  | 'fuel'
  | 'parking'
  | 'tolls'
  | 'accommodation'
  | 'groceries'
  | 'restaurants'
  | 'coffee'
  | 'alcohol'
  | 'activities'
  | 'museum-tickets'
  | 'shopping'
  | 'laundry'
  | 'pharmacy'
  | 'mobile-data'
  | 'insurance'
  | 'incidentals';

export const EXPENSE_CATEGORY_GROUPS: Record<string, ExpenseCategory[]> = {
  Airfare: ['flights'],
  'Ground transport': ['rail', 'bus', 'rental-car', 'fuel', 'parking', 'tolls'],
  Accommodation: ['accommodation'],
  Meals: ['groceries', 'restaurants', 'coffee', 'alcohol'],
  Activities: ['activities', 'museum-tickets'],
  Miscellaneous: ['shopping', 'laundry', 'pharmacy', 'mobile-data', 'insurance', 'incidentals'],
};

export interface Expense {
  id: string;
  label: string;
  category: ExpenseCategory;
  amount: number; // group total, in trip currency
  perTraveller?: boolean; // if true, `amount` is per-traveller and gets multiplied
  status: PaymentStatus;
  refund: RefundPolicy;
  date?: string; // ISO date this expense relates to
  notes?: string;
  linkedEntityId?: string; // accommodation/booking/activity id if applicable
}

export interface Location {
  name: string;
  lat?: number;
  lng?: number;
  mapsQuery?: string; // fallback for Google Maps link generation
}

// `true`/`false` are known facts; `null`/`undefined` means genuinely not
// researched yet -- must never be treated as `false` ("no").
export type AmenityAvailability = boolean | null;
export type KitchenRequirement = 'required' | 'preferred' | 'not-required';

export interface Accommodation {
  id: string;
  name: string;
  city: string;
  address?: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  cost: number;
  paid: number;
  // What this stay needs, independent of what's actually known about it.
  kitchenRequirement?: KitchenRequirement;
  hasKitchen: AmenityAvailability;
  hasParking: AmenityAvailability;
  hasBreakfast: AmenityAvailability;
  cancellationPolicy: RefundPolicy;
  bookingSource?: string;
  confirmationNumber?: string;
  reviewScore?: number; // out of 10
  nearestSupermarketWalkMin?: number;
  nearestParkingWalkMin?: number;
  notes?: string;
  location?: Location;
  isException?: boolean; // e.g. Granada: no kitchen, but value outstanding
  exceptionReason?: string;
  needsOptimization?: boolean;
}

export type TransportMode = 'flight' | 'train' | 'bus' | 'car' | 'walk' | 'taxi';

export interface TransportLeg {
  id: string;
  mode: TransportMode;
  from: string;
  to: string;
  date: string; // ISO date
  departTime?: string;
  arriveTime?: string;
  status: PaymentStatus;
  cost?: number;
  bookingRef?: string;
  notes?: string;
}

export interface VehicleRequirement {
  minSeats: number;
  minLuggage: number;
  warning?: string; // e.g. "Compact car NOT suitable — need minivan/7-seater"
}

export interface ScenarioLineItem {
  id?: string; // absent until the first save -- a booking can only link to a persisted line item
  label: string;
  amount: number;
}

export interface TransportScenario {
  id: string;
  name: string;
  description: string;
  lineItems: ScenarioLineItem[];
  drivingTimeHrs?: number;
  distanceKm?: number;
  flexibilityScore: number; // 1-5
  convenienceScore: number; // 1-5
  vehicleRequirement?: VehicleRequirement;
  pros: string[];
  cons: string[];
  // Several scenarios can exist for comparison; only the explicitly selected
  // one feeds the working budget. Never auto-selected from the recommendation.
  isSelected?: boolean;
}

export interface Activity {
  id: string;
  name: string;
  city: string;
  date?: string;
  time?: string;
  costAdult?: number;
  costYouth?: number;
  costSenior?: number;
  totalCost?: number;
  hasSeniorDiscount?: boolean;
  hasYouthDiscount?: boolean;
  notes?: string;
}

export type BookingCategory = 'flight' | 'train' | 'bus' | 'accommodation' | 'activity' | 'car-rental' | 'food' | 'other';
export type BookingStatus = 'need-booking' | 'reserved' | 'paid';
export type LinkedEntityType = 'accommodation' | 'activity' | 'transport_leg' | 'transport_scenario_line_item';
// A booking must say how it relates to whatever estimate it's linked to (if any):
// - replace: fully substitutes the remaining estimate with this booking's real cost
// - partial: consumes `reconciledAmount` of the estimate, the rest keeps forecasting
// - additional: adds on top of the estimate, which keeps forecasting in full
// - unplanned: no prior estimate at all -- a wholly new cost (booking has no link)
export type BookingReconciliationMode = 'replace' | 'partial' | 'additional' | 'unplanned';

export interface Booking {
  id: string;
  label: string;
  category: BookingCategory;
  status: BookingStatus;
  cost?: number;
  paidAmount?: number;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  reconciliationMode?: BookingReconciliationMode;
  reconciledAmount?: number; // only meaningful when reconciliationMode === 'partial'
  date?: string;
  confirmationNumber?: string;
}

export interface ItineraryStop {
  id: string;
  city: string;
  arriveDate: string; // ISO
  departDate: string; // ISO
  isDayTrip?: boolean;
  parentStopId?: string;
  accommodationId?: string;
  notes?: string;
}

export type ItineraryBlockKind = 'schedule' | 'tip';

export interface ItineraryScheduleBlock {
  id: string;
  kind: ItineraryBlockKind;
  time?: string;
  label: string;
  detail?: string;
}

export interface ItineraryDay {
  id: string;
  date: string; // ISO date
  city: string;
  accommodationId?: string;
  transportLegIds: string[];
  activityIds: string[];
  notes?: string;
  checklist?: { id: string; label: string; done: boolean }[];
  scheduleBlocks: ItineraryScheduleBlock[];
}

export interface PackingItem {
  id: string;
  label: string;
  category: 'shared' | 'personal';
  travellerId?: string; // if personal
  checked: boolean;
}

export interface MealAssumption {
  id: string;
  label: string; // "Cook breakfast", "Lunch out", etc.
  category: ExpenseCategory;
  costPerPerson: number;
  frequency: 'daily' | 'occasional';
  enabled: boolean;
}

export interface TripSettings {
  currency: Currency;
  fuelPricePerLitre: number;
  avgParkingPerDay: number;
  theme: 'light' | 'dark' | 'system';
  contingencyAmount: number;
}

export interface EditLogEntry {
  id: string;
  timestamp: string;
  summary: string;
}

export interface TripData {
  id: string;
  name: string;
  departureDate: string; // ISO — for countdown
  returnDate: string;
  currency: Currency;
  travellers: Traveller[];
  itineraryStops: ItineraryStop[];
  itineraryDays: ItineraryDay[];
  transportLegs: TransportLeg[];
  transportScenarios: TransportScenario[];
  accommodations: Accommodation[];
  activities: Activity[];
  bookings: Booking[];
  expenses: Expense[];
  packingItems: PackingItem[];
  mealAssumptions: MealAssumption[];
  settings: TripSettings;
  editLog: EditLogEntry[];
}
