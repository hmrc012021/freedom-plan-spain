import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, StatusBadge } from '@freedom-plan/ui';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { bookingsFor } from '@/lib/calculations';
import { formatCurrency, formatDate, uid } from '@/lib/utils';
import type { Activity } from '@/types/trip';
import { Plus, Users, Pencil, Trash2, X, Check } from 'lucide-react';

export default function Activities() {
  const trip = useTrip();
  const updateActivity = useTripStore((s) => s.updateActivity);
  const addActivity = useTripStore((s) => s.addActivity);
  const removeActivity = useTripStore((s) => s.removeActivity);
  const [cityFilter, setCityFilter] = useState<'all' | string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // No status field of its own -- an activity is a budget entry until a
  // booking links to it, at which point that booking's status is effective.
  const linkedBooking = (id: string) => bookingsFor(trip, id)[0];

  const cities = [...new Set(trip.activities.map((a) => a.city))];
  const filtered = trip.activities
    .filter((a) => cityFilter === 'all' || a.city === cityFilter)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1; // undated activities sort last
      if (!b.date) return -1;
      return a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '');
    });

  return (
    <AppShell title="Activities">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCityFilter('all')}
            className={`rounded-full border px-3 py-1 text-[12px] ${cityFilter === 'all' ? 'border-petrol-500 bg-petrol-500 text-paper' : 'border-petrol-100 dark:border-dark-border text-ink-soft dark:text-paper-dim/80'}`}
          >
            All cities
          </button>
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`rounded-full border px-3 py-1 text-[12px] ${cityFilter === c ? 'border-petrol-500 bg-petrol-500 text-paper' : 'border-petrol-100 dark:border-dark-border text-ink-soft dark:text-paper-dim/80'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-petrol-600"
        >
          <Plus size={13} /> Add activity
        </button>
      </div>

      {showAddForm && (
        <Card className="mb-4">
          <NewActivityForm
            defaultCity={cities[0] ?? ''}
            onAdd={(act) => {
              addActivity(act);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) =>
          editingId === a.id ? (
            <Card key={a.id}>
              <ActivityEditor
                activity={a}
                onSave={(patch) => {
                  updateActivity(a.id, patch);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onDelete={() => {
                  if (confirm(`Delete "${a.name}"?`)) {
                    removeActivity(a.id);
                    setEditingId(null);
                  }
                }}
              />
            </Card>
          ) : (
            <Card key={a.id}>
              <CardHeader>
                <div>
                  <CardTitle>{a.name}</CardTitle>
                  <div className="mt-0.5 text-[12px] text-slate">
                    {a.city}{a.date && ` · ${formatDate(a.date)}`}{a.time && ` · ${a.time}`}
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(a.id)}
                  className="rounded-md p-1 text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
                  title="Edit activity"
                >
                  <Pencil size={13} />
                </button>
              </CardHeader>

              <div className="mb-3 flex items-center gap-2">
                {linkedBooking(a.id) ? (
                  <StatusBadge status={linkedBooking(a.id)!.status} />
                ) : (
                  <span className="inline-flex items-center rounded-full border border-slate/20 px-2.5 py-0.5 text-[11px] font-medium text-slate">
                    Not booked yet
                  </span>
                )}
              </div>

              {(a.totalCost != null || linkedBooking(a.id)) && (
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-slate">{linkedBooking(a.id) ? 'Total cost (booked)' : 'Total cost (estimate)'}</span>
                  <span className="font-mono-num text-ink dark:text-paper-dim">
                    {formatCurrency(linkedBooking(a.id)?.cost ?? a.totalCost ?? 0, trip.currency)}
                  </span>
                </div>
              )}

              {(a.hasSeniorDiscount || a.hasYouthDiscount) && (
                <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-petrol-500">
                  <Users size={12} />
                  {a.hasSeniorDiscount && 'Senior discount'}
                  {a.hasSeniorDiscount && a.hasYouthDiscount && ' · '}
                  {a.hasYouthDiscount && 'Youth discount'}
                </div>
              )}

              {a.notes && <p className="text-[12px] leading-relaxed text-slate">{a.notes}</p>}
            </Card>
          ),
        )}
      </div>
    </AppShell>
  );
}

function ActivityEditor({
  activity,
  onSave,
  onCancel,
  onDelete,
}: {
  activity: Activity;
  onSave: (patch: Partial<Activity>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(activity.name);
  const [city, setCity] = useState(activity.city);
  const [date, setDate] = useState(activity.date ?? '');
  const [time, setTime] = useState(activity.time ?? '');
  const [totalCost, setTotalCost] = useState(activity.totalCost?.toString() ?? '');
  const [notes, setNotes] = useState(activity.notes ?? '');

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[11px] text-slate">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate">
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Time
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Total cost
          <input
            type="number"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px]"
          />
        </label>
      </div>
      <label className="text-[11px] text-slate">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() =>
            onSave({
              name: name.trim(),
              city: city.trim(),
              date: date || undefined,
              time: time || undefined,
              totalCost: totalCost.trim() === '' ? undefined : Number(totalCost),
              notes: notes.trim() || undefined,
            })
          }
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-petrol-600"
        >
          <Check size={13} /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
        >
          <X size={13} /> Cancel
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-brick-400/30 px-3 py-1.5 text-[12px] font-medium text-brick-500 hover:bg-brick-400/10"
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

function NewActivityForm({
  defaultCity,
  onAdd,
  onCancel,
}: {
  defaultCity: string;
  onAdd: (act: Activity) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [date, setDate] = useState('');
  const [totalCost, setTotalCost] = useState('');

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-[11px] text-slate">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alcazar tour"
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Date (optional)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
      </div>
      <label className="text-[11px] text-slate">
        Total cost (optional)
        <input
          type="number"
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
          className="mt-1 w-40 rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px]"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          disabled={!name.trim() || !city.trim()}
          onClick={() =>
            onAdd({
              id: uid('act'),
              name: name.trim(),
              city: city.trim(),
              date: date || undefined,
              totalCost: totalCost.trim() === '' ? undefined : Number(totalCost),
            })
          }
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-petrol-600 disabled:opacity-40"
        >
          <Plus size={13} /> Add activity
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
        >
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}
