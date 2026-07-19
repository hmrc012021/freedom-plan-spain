import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@freedom-plan/ui';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { exportTripJSON, readTripJSONFile } from '@/lib/exportImport';
import { ACCENT_PRESETS, applyAccent, getStoredAccentId } from '@/lib/accentPreference';
import { supabase } from '@/lib/supabaseClient';
import {
  addTripMemberByEmail,
  getTripMembers,
  removeTripMember,
  type TripMember,
} from '@/lib/tripRepository';
import { Download, Upload, RotateCcw, Check, LogOut } from 'lucide-react';
import type { Currency } from '@/types/trip';

export default function Settings() {
  const trip = useTrip();
  const updateSettings = useTripStore((s) => s.updateSettings);
  const updateTraveller = useTripStore((s) => s.updateTraveller);
  const importTrip = useTripStore((s) => s.importTrip);
  const resetTrip = useTripStore((s) => s.resetTrip);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accentId, setAccentId] = useState(getStoredAccentId());

  function handleAccentPick(id: string) {
    applyAccent(id);
    setAccentId(id);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readTripJSONFile(file);
      importTrip(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      e.target.value = '';
    }
  }

  return (
    <AppShell title="Settings">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Field label="Currency">
              <select
                value={trip.settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value as Currency })}
                className="w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-3 py-1.5 text-[13px]"
              >
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </Field>
            <Field label="Fuel price (per litre)">
              <input
                type="number"
                step="0.01"
                value={trip.settings.fuelPricePerLitre}
                onChange={(e) => updateSettings({ fuelPricePerLitre: Number(e.target.value) })}
                className="w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-3 py-1.5 font-mono-num text-[13px]"
              />
            </Field>
            <Field label="Average parking (per day)">
              <input
                type="number"
                step="0.5"
                value={trip.settings.avgParkingPerDay}
                onChange={(e) => updateSettings({ avgParkingPerDay: Number(e.target.value) })}
                className="w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-3 py-1.5 font-mono-num text-[13px]"
              />
            </Field>
            <Field label="Incidentals / contingency reserve">
              <input
                type="number"
                step="10"
                value={trip.settings.contingencyAmount}
                onChange={(e) => updateSettings({ contingencyAmount: Number(e.target.value) })}
                className="w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-3 py-1.5 font-mono-num text-[13px]"
              />
              <p className="mt-1 text-[11px] text-slate">
                A dedicated, editable category — never a percentage of the trip total.
              </p>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <p className="mb-3 text-[12px] text-slate">
            Accent color is personal to this device — it's saved in your browser only, not shared with
            other people editing this trip.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleAccentPick(preset.id)}
                title={preset.label}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-paper dark:ring-offset-dark-bg transition-all"
                  style={{
                    background: preset.swatch,
                    ['--tw-ring-color' as string]: accentId === preset.id ? preset.swatch : 'transparent',
                  }}
                >
                  {accentId === preset.id && <Check size={15} className="text-white drop-shadow" />}
                </span>
                <span className="text-[10.5px] text-slate">{preset.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Travellers</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {trip.travellers.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-petrol-50 dark:border-dark-border/60 px-3 py-2">
                <div className="flex-1 min-w-0 pr-2">
                  <input
                    value={t.name}
                    onChange={(e) => updateTraveller(t.id, { name: e.target.value })}
                    className="w-full rounded-md bg-transparent px-1.5 -mx-1.5 py-0.5 text-[13px] font-medium text-ink dark:text-paper-dim outline-none hover:bg-petrol-50 dark:hover:bg-dark-border focus:bg-petrol-50 dark:focus:bg-dark-border"
                  />
                  <div className="text-[11.5px] text-slate px-1.5">{t.ageLabel}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {t.isSenior && <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 text-[10.5px] text-amber-500">Senior</span>}
                  {t.isYouth && <span className="rounded-full bg-petrol-50 dark:bg-petrol-900/40 px-2 py-0.5 text-[10.5px] text-petrol-500">Youth</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate">
            Senior and youth flags drive discount eligibility across Activities. Group cost is the primary
            calculation; cost per traveller is derived automatically.
          </p>
        </Card>

        <MembersCard tripId={trip.id} />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportTripJSON(trip)}
              className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12.5px] font-medium text-paper hover:bg-petrol-600"
            >
              <Download size={13} /> Export trip JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12.5px] font-medium text-ink-soft dark:text-paper-dim/80 hover:bg-petrol-50 dark:hover:bg-dark-border"
            >
              <Upload size={13} /> Import trip JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
            <button
              onClick={() => confirm('Reset to the original Spain trip data? This overwrites current edits.') && resetTrip()}
              className="flex items-center gap-1.5 rounded-lg border border-brick-400/30 px-3 py-1.5 text-[12.5px] font-medium text-brick-500 hover:bg-brick-400/10"
            >
              <RotateCcw size={13} /> Reset to sample trip
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12.5px] font-medium text-ink-soft dark:text-paper-dim/80 hover:bg-petrol-50 dark:hover:bg-dark-border"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate">
            Everyone with access to this trip is editing the same live data in Supabase — changes save
            automatically as you type, nothing is stored only in this browser. Export JSON below anytime
            for an offline backup or to move this trip to another environment.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function MembersCard({ tripId }: { tripId: string }) {
  const [members, setMembers] = useState<TripMember[] | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      setMembers(await getTripMembers(tripId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await addTripMemberByEmail(tripId, email.trim(), role);
      setEmail('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeTripMember(tripId, userId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who has access</CardTitle>
      </CardHeader>
      <p className="mb-3 text-[12px] text-slate">
        You&apos;re the owner. Add family members by the email they used to sign up --
        editors can change plans, viewers can only look.
      </p>

      <div className="space-y-2 mb-3">
        {members === null ? (
          <p className="text-[12px] text-slate">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-[12px] text-slate">No other members yet.</p>
        ) : (
          members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border border-petrol-50 dark:border-dark-border/60 px-3 py-2"
            >
              <div>
                <div className="text-[13px] font-medium text-ink dark:text-paper-dim">{m.email}</div>
                <div className="text-[11px] text-slate capitalize">{m.role}</div>
              </div>
              {m.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(m.user_id)}
                  className="text-[11.5px] text-brick-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="email"
            required
            placeholder="family.member@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-3 py-1.5 text-[13px]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            className="rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1.5 text-[13px]"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        {error && <p className="text-[12px] text-brick-500">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-petrol-500 px-3 py-1.5 text-[12.5px] font-medium text-paper hover:bg-petrol-600 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add member'}
        </button>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-slate">{label}</span>
      {children}
    </label>
  );
}
