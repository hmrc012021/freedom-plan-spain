// Hand-authored to match the migrations in supabase/migrations exactly.
// Regenerate/verify against the live schema with:
//   npx supabase gen types typescript --project-id ojwxetjlxqhjtltuycml --schema spain_travel_companion

export type PaymentStatus = 'paid' | 'booked' | 'reserved' | 'estimated' | 'optional' | 'cancelled';
export type BookingStatus = 'need-booking' | 'reserved' | 'paid';
export type RefundPolicy = 'refundable' | 'non-refundable' | 'partial';
export type TransportMode = 'flight' | 'train' | 'bus' | 'car' | 'walk' | 'taxi';
export type BookingCategory = 'flight' | 'train' | 'bus' | 'accommodation' | 'activity' | 'car-rental' | 'food' | 'other';
export type KitchenRequirement = 'required' | 'preferred' | 'not-required';
export type BookingReconciliationMode = 'replace' | 'partial' | 'additional' | 'unplanned';
export type ExpenseCategory =
  | 'flights' | 'rail' | 'bus' | 'rental-car' | 'fuel' | 'parking' | 'tolls'
  | 'accommodation' | 'groceries' | 'restaurants' | 'coffee' | 'alcohol'
  | 'activities' | 'museum-tickets' | 'shopping' | 'laundry' | 'pharmacy'
  | 'mobile-data' | 'insurance' | 'incidentals';
export type MealFrequency = 'daily' | 'occasional';
export type PackingCategory = 'shared' | 'personal';
export type ThemePreference = 'light' | 'dark' | 'system';
export type ScenarioNoteKind = 'pro' | 'con';
export type LinkedEntityType = 'accommodation' | 'activity' | 'transport_leg' | 'transport_scenario_line_item' | 'booking';

interface Row<T> { Row: T; Insert: Partial<T> & Record<string, unknown>; Update: Partial<T>; Relationships: [] }

export interface Database {
  spain_travel_companion: {
    Tables: {
      trips: Row<{
        id: string;
        owner_id: string | null;
        name: string;
        version: number;
        currency: 'EUR' | 'USD' | 'GBP';
        departure_date: string | null;
        return_date: string | null;
        fuel_price_per_litre: number;
        avg_parking_per_day: number;
        contingency_amount: number;
        theme: ThemePreference;
        created_at: string;
        updated_at: string;
      }>;
      trip_members: Row<{
        trip_id: string;
        user_id: string;
        role: 'owner' | 'editor' | 'viewer';
        created_at: string;
      }>;
      trip_snapshots: Row<{
        id: string;
        trip_id: string;
        created_by: string | null;
        reason: string;
        data: Record<string, unknown>;
        created_at: string;
      }>;
      travellers: Row<{
        id: string;
        trip_id: string;
        name: string;
        age_label: string;
        age: number | null;
        is_youth: boolean;
        is_senior: boolean;
        sort_order: number;
        created_at: string;
      }>;
      accommodations: Row<{
        id: string;
        trip_id: string;
        name: string;
        city: string;
        address: string | null;
        check_in: string;
        check_out: string;
        cost: number;
        paid: number;
        kitchen_requirement: KitchenRequirement;
        has_kitchen: boolean | null;
        has_parking: boolean | null;
        has_breakfast: boolean | null;
        cancellation_policy: RefundPolicy;
        booking_source: string | null;
        confirmation_number: string | null;
        review_score: number | null;
        nearest_supermarket_walk_min: number | null;
        nearest_parking_walk_min: number | null;
        notes: string | null;
        is_exception: boolean;
        exception_reason: string | null;
        needs_optimization: boolean;
        lat: number | null;
        lng: number | null;
        maps_query: string | null;
        created_at: string;
      }>;
      itinerary_days: Row<{
        id: string;
        trip_id: string;
        date: string;
        city: string;
        accommodation_id: string | null;
        notes: string | null;
        created_at: string;
      }>;
      itinerary_day_checklist_items: Row<{
        id: string;
        day_id: string;
        label: string;
        done: boolean;
        sort_order: number;
      }>;
      transport_legs: Row<{
        id: string;
        trip_id: string;
        mode: TransportMode;
        from_city: string;
        to_city: string;
        leg_date: string;
        depart_time: string | null;
        arrive_time: string | null;
        status: PaymentStatus;
        cost: number | null;
        booking_ref: string | null;
        notes: string | null;
        created_at: string;
      }>;
      itinerary_day_transport_legs: Row<{ day_id: string; leg_id: string }>;
      transport_scenarios: Row<{
        id: string;
        trip_id: string;
        name: string;
        description: string | null;
        driving_time_hrs: number | null;
        distance_km: number | null;
        flexibility_score: number;
        convenience_score: number;
        vehicle_min_seats: number | null;
        vehicle_min_luggage: number | null;
        vehicle_warning: string | null;
        sort_order: number;
        is_selected: boolean;
        created_at: string;
      }>;
      transport_scenario_line_items: Row<{
        id: string;
        scenario_id: string;
        label: string;
        amount: number;
        sort_order: number;
      }>;
      transport_scenario_notes: Row<{
        id: string;
        scenario_id: string;
        kind: ScenarioNoteKind;
        note: string;
        sort_order: number;
      }>;
      activities: Row<{
        id: string;
        trip_id: string;
        name: string;
        city: string;
        activity_date: string | null;
        activity_time: string | null;
        cost_adult: number | null;
        cost_youth: number | null;
        cost_senior: number | null;
        total_cost: number | null;
        has_senior_discount: boolean;
        has_youth_discount: boolean;
        notes: string | null;
        created_at: string;
      }>;
      itinerary_day_activities: Row<{ day_id: string; activity_id: string }>;
      bookings: Row<{
        id: string;
        trip_id: string;
        label: string;
        category: BookingCategory;
        status: BookingStatus;
        cost: number | null;
        paid_amount: number | null;
        linked_entity_type: LinkedEntityType | null;
        linked_entity_id: string | null;
        reconciliation_mode: BookingReconciliationMode;
        reconciled_amount: number | null;
        booking_date: string | null;
        confirmation_number: string | null;
        created_at: string;
      }>;
      expenses: Row<{
        id: string;
        trip_id: string;
        label: string;
        category: ExpenseCategory;
        amount: number;
        per_traveller: boolean;
        status: PaymentStatus;
        refund: RefundPolicy;
        expense_date: string | null;
        notes: string | null;
        linked_entity_type: LinkedEntityType | null;
        linked_entity_id: string | null;
        created_at: string;
      }>;
      packing_items: Row<{
        id: string;
        trip_id: string;
        label: string;
        category: PackingCategory;
        traveller_id: string | null;
        checked: boolean;
        created_at: string;
      }>;
      meal_assumptions: Row<{
        id: string;
        trip_id: string;
        label: string;
        category: ExpenseCategory;
        cost_per_person: number;
        frequency: MealFrequency;
        enabled: boolean;
        sort_order: number;
      }>;
      edit_log: Row<{
        id: string;
        trip_id: string;
        summary: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      get_trip_members: {
        Args: { p_trip_id: string };
        Returns: { user_id: string; email: string; role: 'owner' | 'editor' | 'viewer' }[];
      };
      add_trip_member_by_email: {
        Args: { p_trip_id: string; p_email: string; p_role: string };
        Returns: void;
      };
      remove_trip_member: {
        Args: { p_trip_id: string; p_user_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
