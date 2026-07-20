import { create } from 'zustand';
import type {
  TripData, Accommodation, Expense, Activity, Booking, TransportScenario,
  PackingItem, MealAssumption, TripSettings, ItineraryDay, ItineraryScheduleBlock,
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
  removeActivity: (id: string) => void;

  updateBooking: (id: string, patch: Partial<Booking>) => void;
  addBooking: (booking: Booking) => void;
  removeBooking: (id: string) => void;

  addItineraryDay: (day: { date: string; city: string; notes?: string }) => void;
  updateItineraryDay: (
    id: string,
    patch: { date?: string; city?: string; notes?: string; accommodationId?: string | null; scheduleBlocks?: ItineraryScheduleBlock[] },
  ) => void;
  removeItineraryDay: (id: string) => void;

  updateScenario: (id: string, patch: Partial<TransportScenario>) => void;
  selectTransportScenario: (id: string) => void;

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
    const current = trip.accommodations.find((a) => a.id === id);
    const updated = current ? { ...current, ...patch } : undefined;
    const datesChanged = updated && (patch.checkIn !== undefined || patch.checkOut !== undefined);

    // Editing dates relinks which itinerary days point at this accommodation:
    // clear any day that no longer falls in [checkIn, checkOut), link any
    // that now does. Mirrors the equivalent server-side sync below.
    const itineraryDays = datesChanged
      ? trip.itineraryDays.map((d) => {
          const inWindow = updated!.checkIn <= d.date && d.date < updated!.checkOut;
          if (inWindow) return { ...d, accommodationId: id };
          if (d.accommodationId === id) return { ...d, accommodationId: undefined };
          return d;
        })
      : trip.itineraryDays;

    set({
      trip: {
        ...trip,
        accommodations: trip.accommodations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        itineraryDays,
      },
    });
    void repo.upsertAccommodation(trip.id, { id, ...patch });
    if (datesChanged) void repo.syncAccommodationItinerary(trip.id, id, updated!.checkIn, updated!.checkOut);
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
    // activities.id is a real Postgres uuid; act.id here is a client-side
    // placeholder, so swap in the DB-generated id once the insert resolves
    // (same reconciliation as addBooking below).
    void repo.insertActivity(trip.id, act).then((realId) => {
      if (!realId) return;
      const t = get().trip;
      if (!t) return;
      set({ trip: { ...t, activities: t.activities.map((a) => (a.id === act.id ? { ...a, id: realId } : a)) } });
    });
    get().logEdit(`Added activity: ${act.name}`);
  },

  removeActivity: (id) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, activities: trip.activities.filter((a) => a.id !== id) } });
    void repo.deleteActivity(trip.id, id);
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

  removeBooking: (id) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, bookings: trip.bookings.filter((b) => b.id !== id) } });
    void repo.deleteBooking(trip.id, id);
  },

  addItineraryDay: (day) => {
    const trip = get().trip;
    if (!trip) return;
    const tempId = uid('day');
    const newDay: ItineraryDay = { id: tempId, date: day.date, city: day.city, notes: day.notes, transportLegIds: [], activityIds: [], scheduleBlocks: [] };
    set({ trip: { ...trip, itineraryDays: [...trip.itineraryDays, newDay].sort((a, b) => a.date.localeCompare(b.date)) } });
    void repo.insertItineraryDay(trip.id, day).then((realId) => {
      if (!realId) return;
      const t = get().trip;
      if (!t) return;
      set({ trip: { ...t, itineraryDays: t.itineraryDays.map((d) => (d.id === tempId ? { ...d, id: realId } : d)) } });
    });
    get().logEdit(`Added itinerary day: ${day.city} (${day.date})`);
  },

  updateItineraryDay: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({
      trip: {
        ...trip,
        itineraryDays: trip.itineraryDays
          .map((d) => (d.id === id ? { ...d, ...patch, accommodationId: patch.accommodationId ?? d.accommodationId } : d))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
    void repo.updateItineraryDay(trip.id, id, patch);
    if (patch.scheduleBlocks) void repo.updateItineraryScheduleBlocks(id, patch.scheduleBlocks);
    get().logEdit('Updated itinerary day');
  },

  removeItineraryDay: (id) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, itineraryDays: trip.itineraryDays.filter((d) => d.id !== id) } });
    void repo.deleteItineraryDay(trip.id, id);
  },

  updateScenario: (id, patch) => {
    const trip = get().trip;
    if (!trip) return;
    set({ trip: { ...trip, transportScenarios: trip.transportScenarios.map((s) => (s.id === id ? { ...s, ...patch } : s)) } });
    if (patch.lineItems) void repo.updateScenarioLineItems(id, patch.lineItems);
  },

  // Several scenarios can exist for comparison; only the one explicitly
  // selected here feeds the working budget -- never automatic, never the
  // cheapest-recommended one by default.
  selectTransportScenario: (id) => {
    const trip = get().trip;
    if (!trip) return;
    set({
      trip: {
        ...trip,
        transportScenarios: trip.transportScenarios.map((s) => ({ ...s, isSelected: s.id === id })),
      },
    });
    void repo.selectTransportScenario(trip.id, id);
    get().logEdit('Selected transport scenario for working budget');
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
    void repo.insertPackingItem(trip.id, item).then((realId) => {
      if (!realId) return;
      const t = get().trip;
      if (!t) return;
      set({ trip: { ...t, packingItems: t.packingItems.map((p) => (p.id === item.id ? { ...p, id: realId } : p)) } });
    });
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
