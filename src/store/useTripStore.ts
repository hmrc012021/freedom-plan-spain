import { create } from 'zustand';
import type {
  TripData, Accommodation, Expense, Activity, Booking, TransportScenario,
  PackingItem, MealAssumption, TripSettings,
} from '@/types/trip';
import { TRIP_ID } from '@/lib/supabaseClient';
import * as repo from '@/lib/tripRepository';
import { uid } from '@/lib/utils';

interface TripStore {
  trip: TripData | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;

  load: () => Promise<void>;
  logEdit: (summary: string) => void;

  updateAccommodation: (id: string, patch: Partial<Accommodation>) => void;
  updateTraveller: (id: string, patch: { name?: string; ageLabel?: string }) => void;

  updateExpense: (id: string, patch: Partial<Expense>) => void;
  addExpense: (exp: Expense) => void;
  removeExpense: (id: string) => void;

  updateActivity: (id: string, patch: Partial<Activity>) => void;
  addActivity: (act: Activity) => void;

  updateBooking: (id: string, patch: Partial<Booking>) => void;
  addBooking: (booking: Booking) => void;

  updateScenario: (id: string, patch: Partial<TransportScenario>) => void;

  togglePackingItem: (id: string) => void;
  addPackingItem: (item: PackingItem) => void;
  removePackingItem: (id: string) => void;

  updateMealAssumption: (id: string, patch: Partial<MealAssumption>) => void;

  updateSettings: (patch: Partial<TripSettings>) => void;

  toggleDayChecklistItem: (date: string, checklistId: string) => void;

  importTrip: (data: TripData) => void;
  resetTrip: () => void;
}

// Convenience hook for the page components: they only ever render once the
// App-level loading gate has confirmed `trip` is populated, so this keeps
// every page's code free of null-checks while staying type-safe.
export function useTrip(): TripData {
  const trip = useTripStore((s) => s.trip);
  if (!trip) throw new Error('useTrip() called before the trip finished loading');
  return trip;
}

// Local-only mutator: updates in-memory state immediately for a snappy UI,
// the caller is responsible for firing the matching Supabase write alongside it.
export const useTripStore = create<TripStore>()((set, get) => ({
  trip: null,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const trip = await repo.fetchTrip(TRIP_ID);
      set({ trip, status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load trip' });
    }
  },

  logEdit: (summary) => {
    const trip = get().trip;
    if (!trip) return;
    set({
      trip: {
        ...trip,
        editLog: [{ id: uid('log'), timestamp: new Date().toISOString(), summary }, ...trip.editLog].slice(0, 50),
      },
    });
    void repo.logEdit(trip.id, summary);
  },

  updateAccommodation: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, accommodations: trip.accommodations.map((a) => (a.id === id ? { ...a, ...patch } : a)) } });
    void repo.upsertAccommodation(trip.id, { id, ...patch });
    get().logEdit(`Updated accommodation: ${patch.name ?? id}`);
  },

  updateTraveller: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, travellers: trip.travellers.map((t) => (t.id === id ? { ...t, ...patch } : t)) } });
    void repo.upsertTraveller(trip.id, id, patch);
    get().logEdit(`Updated traveller: ${patch.name ?? id}`);
  },

  updateExpense: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, expenses: trip.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) } });
    void repo.upsertExpense(trip.id, { id, ...patch });
  },

  addExpense: (exp) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, expenses: [...trip.expenses, exp] } });
    void repo.insertExpense(trip.id, exp);
    get().logEdit(`Added expense: ${exp.label}`);
  },

  removeExpense: (id) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, expenses: trip.expenses.filter((e) => e.id !== id) } });
    void repo.deleteExpense(trip.id, id);
  },

  updateActivity: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, activities: trip.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) } });
    void repo.upsertActivity(trip.id, { id, ...patch });
  },

  addActivity: (act) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, activities: [...trip.activities, act] } });
    void repo.insertActivity(trip.id, act);
    get().logEdit(`Added activity: ${act.name}`);
  },

  updateBooking: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, bookings: trip.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) } });
    void repo.upsertBooking(trip.id, id, patch);
  },

  addBooking: (booking) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, bookings: [...trip.bookings, booking] } });
    void repo.insertBooking(trip.id, booking).then((realId) => {
      if (!realId) return;
      const t = get().trip;
      if (!t) return;
      set({ trip: { ...t, bookings: t.bookings.map((b) => (b.id === booking.id ? { ...b, id: realId } : b)) } });
    });
    get().logEdit(`Added booking: ${booking.label}`);
  },

  updateScenario: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, transportScenarios: trip.transportScenarios.map((s) => (s.id === id ? { ...s, ...patch } : s)) } });
    if (patch.lineItems) void repo.updateScenarioLineItems(id, patch.lineItems);
  },

  togglePackingItem: (id) => {
    const trip = get().trip;
    if (!trip) return;
    const item = trip.packingItems.find((p) => p.id === id);
    if (!item) return;
    const checked = !item.checked;
    set({ trip: { ...trip, packingItems: trip.packingItems.map((p) => (p.id === id ? { ...p, checked } : p)) } });
    void repo.togglePackingItem(trip.id, id, checked);
  },

  addPackingItem: (item) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, packingItems: [...trip.packingItems, item] } });
    void repo.insertPackingItem(trip.id, item);
  },

  removePackingItem: (id) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, packingItems: trip.packingItems.filter((p) => p.id !== id) } });
    void repo.deletePackingItem(trip.id, id);
  },

  updateMealAssumption: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, mealAssumptions: trip.mealAssumptions.map((m) => (m.id === id ? { ...m, ...patch } : m)) } });
    void repo.upsertMealAssumption(trip.id, id, patch);
  },

  updateSettings: (patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, settings: { ...trip.settings, ...patch } } });
    void repo.updateTripSettings(trip.id, patch);
    get().logEdit('Updated settings');
  },

  toggleDayChecklistItem: (date, checklistId) => {
    const trip = get().trip;
    if (!trip) return;
    let done = false;
    const itineraryDays = trip.itineraryDays.map((d) => {
      if (d.date !== date) return d;
      return {
        ...d,
        checklist: (d.checklist ?? []).map((c) => {
          if (c.id !== checklistId) return c;
          done = !c.done;
          return { ...c, done };
        }),
      };
    });
    set({ trip: { ...trip, itineraryDays } });
    void repo.toggleDayChecklistItem(checklistId, done);
  },

  // Full-document import/reset remain useful for backups, but no longer write
  // through a jsonb column -- they simply replace in-memory state. Persisting
  // an imported snapshot back to the normalized tables would need a dedicated
  // bulk-upsert endpoint, intentionally out of scope here (see README).
  importTrip: (data) => set({ trip: data }),
  resetTrip: () => { void get().load(); },
}));
