import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useTripStore } from '@/store/useTripStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Itinerary from '@/pages/Itinerary';
import Budget from '@/pages/Budget';
import Accommodation from '@/pages/Accommodation';
import Transport from '@/pages/Transport';
import Food from '@/pages/Food';
import Bookings from '@/pages/Bookings';
import Activities from '@/pages/Activities';
import Packing from '@/pages/Packing';
import Settings from '@/pages/Settings';

export default function App() {
  const status = useTripStore((s) => s.status);
  const error = useTripStore((s) => s.error);
  const load = useTripStore((s) => s.load);

  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink-soft)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-petrol-500)] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5] text-[#444B54]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#0F5257] border-t-transparent" />
          <p className="text-sm">Loading trip from Supabase…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5] px-6">
        <div className="max-w-md rounded-2xl border border-[#A64E3B]/30 bg-[#A64E3B]/5 p-6 text-center">
          <p className="mb-2 font-semibold text-[#A64E3B]">Couldn't load the trip</p>
          <p className="text-sm text-[#444B54]">{error}</p>
          <p className="mt-3 text-xs text-[#6B7280]">
            Check that .env.local has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set, and that the
            spain_travel_companion schema is exposed in the project's Data API settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/accommodation" element={<Accommodation />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/food" element={<Food />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/packing" element={<Packing />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}
