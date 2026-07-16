import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in the project values.'
  );
}

// All domain tables live in the spain_travel_companion schema (this Supabase
// project also hosts unrelated apps in other schemas), so the client is
// pinned to it once here rather than per-call.
export const supabase = createClient<Database, 'spain_travel_companion'>(url, anonKey, {
  db: { schema: 'spain_travel_companion' },
});

export const TRIP_ID = import.meta.env.VITE_TRIP_ID ?? 'spain-portugal-2026';

// Real email/password accounts only -- no anonymous sign-in. The seeded
// trip's owner_id is claimed to a real user (see README), and can_read_trip
// / can_edit_trip lock out anyone who isn't that owner or a trip_members row,
// so an authenticated-but-unauthorized caller simply gets an empty/failed
// read rather than any special-casing here.
export async function getRealSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
