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
  Transport: ['flights', 'rail', 'bus', 'rental-car', 'fuel', 'parking', 'tolls'],
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

export interface Accommodation {
  id: string;
  name: string;
  city: string;
  address?: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  cost: number;
  paid: number;
  hasKitchen: boolean;
  hasParking: boolean;
  hasBreakfast: boolean;
  cancellationPolicy: RefundPolicy;
  bookingSource?: string;
  confirmationNumber?: string;
  reviewScore?: number; // out of 10
  nearestSupermarketWalkMin?: number;
  nearestParkingWalkMin?: number;
  notes?: string;
  status: PaymentStatus;
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
}

export type ActivityStatus = 'booked' | 'planned' | 'idea' | 'cancelled' | 'need-tickets' | 'need-reservation';

export interface Activity {
  id: string;
  name: string;
  city: string;
  date?: string;
  time?: string;
  status: ActivityStatus;
  costAdult?: number;
  costYouth?: number;
  costSenior?: number;
  totalCost?: number;
  paid: boolean;
  hasSeniorDiscount?: boolean;
  hasYouthDiscount?: boolean;
  notes?: string;
}

export type BookingCategory = 'flight' | 'train' | 'accommodation' | 'activity' | 'car-rental' | 'other';

export interface Booking {
  id: string;
  label: string;
  category: BookingCategory;
  status: PaymentStatus | 'researching' | 'need-booking';
  cost?: number;
  paidAmount?: number;
  linkedEntityId?: string;
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

export interface ItineraryDay {
  id: string;
  date: string; // ISO date
  city: string;
  accommodationId?: string;
  transportLegIds: string[];
  activityIds: string[];
  notes?: string;
  checklist?: { id: string; label: string; done: boolean }[];
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
