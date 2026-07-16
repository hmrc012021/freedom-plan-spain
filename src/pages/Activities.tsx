import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { formatCurrency, formatDate, uid } from '@/lib/utils';
import type { Activity, ActivityStatus } from '@/types/trip';
import { Plus, Users } from 'lucide-react';

const STATUSES: ActivityStatus[] = ['booked', 'planned', 'idea', 'need-tickets', 'need-reservation', 'cancelled'];

export default function Activities() {
  const trip = useTrip();
  const updateActivity = useTripStore((s) => s.updateActivity);
  const addActivity = useTripStore((s) => s.addActivity);
  const [cityFilter, setCityFilter] = useState<'all' | string>('all');

  const cities = [...new Set(trip.activities.map((a) => a.city))];
  const filtered = trip.activities.filter((a) => cityFilter === 'all' || a.city === cityFilter);

  function handleAdd() {
    const act: Activity = {
      id: uid('act'),
      name: 'New activity',
      city: cities[0] ?? 'Faro',
      status: 'idea',
      paid: false,
    };
    addActivity(act);
  }

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
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-petrol-600"
        >
          <Plus size={13} /> Add activity
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div>
                <CardTitle>{a.name}</CardTitle>
                <div className="mt-0.5 text-[12px] text-slate">
                  {a.city}{a.date && ` · ${formatDate(a.date)}`}{a.time && ` · ${a.time}`}
                </div>
              </div>
            </CardHeader>

            <div className="mb-3 flex items-center gap-2">
              <select
                value={a.status}
                onChange={(e) => updateActivity(a.id, { status: e.target.value as ActivityStatus })}
                className="rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12px]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                ))}
              </select>
              <StatusBadge status={a.status} />
            </div>

            {a.totalCost != null && (
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="text-slate">Total cost</span>
                <span className="font-mono-num text-ink dark:text-paper-dim">{formatCurrency(a.totalCost, trip.currency)}</span>
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

            <label className="mt-3 flex items-center gap-2 border-t border-petrol-100 dark:border-dark-border pt-3 text-[12.5px] text-ink-soft dark:text-paper-dim/80">
              <input
                type="checkbox"
                checked={a.paid}
                onChange={(e) => updateActivity(a.id, { paid: e.target.checked })}
                className="accent-petrol-500"
              />
              Paid
            </label>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
