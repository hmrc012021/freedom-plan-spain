import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { scoreAccommodation } from '@/lib/calculations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { UtensilsCrossed, ParkingCircle, Coffee, AlertTriangle, Star } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export default function Accommodation() {
  const trip = useTrip();
  const updateAccommodation = useTripStore((s) => s.updateAccommodation);

  const scored = useMemo(
    () =>
      trip.accommodations
        .map((acc) => ({ acc, score: scoreAccommodation(acc, trip) }))
        .sort((a, b) => parseISO(a.acc.checkIn).getTime() - parseISO(b.acc.checkIn).getTime()),
    [trip]
  );

  return (
    <AppShell title="Accommodation">
      <div className="mb-4 rounded-xl border border-dashed border-petrol-100 dark:border-dark-border bg-petrol-50/40 dark:bg-dark-surface p-3.5 text-[12.5px] leading-relaxed text-ink-soft dark:text-paper-dim/80">
        Priority order: <b>kitchen</b> → <b>location</b> → <b>parking</b> → <b>value</b> → <b>price</b>. This app never
        optimizes for the lowest nightly rate alone — every score below weighs meal savings and parking savings
        against the nominal rate.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {scored.map(({ acc, score }) => {
          const nights = Math.max(differenceInCalendarDays(parseISO(acc.checkOut), parseISO(acc.checkIn)), 1);
          return (
            <Card key={acc.id} className={acc.needsOptimization ? 'border-brick-400/40' : undefined}>
              <CardHeader>
                <div>
                  <CardTitle>{acc.name}</CardTitle>
                  <div className="mt-0.5 text-[12px] text-slate">
                    {acc.city} · {formatDate(acc.checkIn)} – {formatDate(acc.checkOut)} · {nights} nights
                  </div>
                </div>
                <StatusBadge status={acc.status} />
              </CardHeader>

              {acc.needsOptimization && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-brick-400/10 px-3 py-2 text-[12.5px] text-brick-500">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Previous booking cancelled — needs re-optimization for a replacement with a kitchen.
                </div>
              )}
              {acc.isException && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-500">
                  <Star size={14} className="mt-0.5 shrink-0" />
                  {acc.exceptionReason}
                </div>
              )}

              <div className="mb-3 flex flex-wrap gap-2 text-[11.5px]">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${acc.hasKitchen ? 'border-petrol-400/30 text-petrol-500' : 'border-slate/20 text-slate'}`}>
                  <UtensilsCrossed size={12} /> {acc.hasKitchen ? 'Kitchen' : 'No kitchen'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${acc.hasParking ? 'border-petrol-400/30 text-petrol-500' : 'border-slate/20 text-slate'}`}>
                  <ParkingCircle size={12} /> {acc.hasParking ? 'Parking' : 'No parking'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${acc.hasBreakfast ? 'border-petrol-400/30 text-petrol-500' : 'border-slate/20 text-slate'}`}>
                  <Coffee size={12} /> {acc.hasBreakfast ? 'Breakfast' : 'No breakfast'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl bg-petrol-50/60 dark:bg-dark-border/40 p-3 text-center">
                <div>
                  <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">{score.score}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate">Score /100</div>
                </div>
                <div>
                  <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
                    {formatCurrency(score.effectiveCostPerNight, trip.currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate">Effective/night</div>
                </div>
                <div>
                  <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
                    {formatCurrency(acc.cost, trip.currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate">Total cost</div>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-slate">
                {score.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-petrol-400">·</span>
                    {r}
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-petrol-100 dark:border-dark-border pt-3">
                <label className="text-[12px] text-slate">
                  Cost total
                  <input
                    type="number"
                    value={acc.cost}
                    onChange={(e) => updateAccommodation(acc.id, { cost: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 font-mono-num text-ink dark:text-paper-dim"
                  />
                </label>
                <label className="text-[12px] text-slate">
                  Paid
                  <input
                    type="number"
                    value={acc.paid}
                    onChange={(e) => updateAccommodation(acc.id, { paid: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 font-mono-num text-ink dark:text-paper-dim"
                  />
                </label>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
