import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@freedom-plan/ui';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { computeMealBudget, tripDurationDays } from '@/lib/calculations';
import { formatCurrency, formatCurrencyPrecise } from '@/lib/utils';

export default function Food() {
  const trip = useTrip();
  const updateMealAssumption = useTripStore((s) => s.updateMealAssumption);

  const [mealDays, setMealDays] = useState(tripDurationDays(trip));
  const mealBudget = useMemo(() => computeMealBudget(trip, mealDays), [trip, mealDays]);

  return (
    <AppShell title="Food">
      <Card>
        <CardHeader>
          <CardTitle>Meal budget</CardTitle>
          <span className="font-mono-num text-xs text-slate">{mealDays} days · {trip.travellers.length} travellers</span>
        </CardHeader>

        <p className="mb-4 text-[12.5px] leading-relaxed text-slate">
          This is a scenario, not a ledger — play with the per-person rates to see how the estimate moves. It
          feeds the Food line on the Budget page until a real food-category booking is entered, at which point
          that booking's cost takes over.
        </p>

        <input
          type="range"
          min={1}
          max={20}
          value={mealDays}
          onChange={(e) => setMealDays(Number(e.target.value))}
          className="w-full accent-petrol-500"
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            {trip.mealAssumptions.map((m) => (
              <label key={m.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex items-center gap-2 text-ink-soft dark:text-paper-dim/80">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => updateMealAssumption(m.id, { enabled: e.target.checked })}
                    className="accent-petrol-500"
                  />
                  {m.label}
                </span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={m.costPerPerson}
                    onChange={(e) => updateMealAssumption(m.id, { costPerPerson: Number(e.target.value) })}
                    className="w-16 rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-1.5 py-0.5 text-right font-mono-num text-ink dark:text-paper-dim"
                    step="0.5"
                  />
                  <span className="whitespace-nowrap text-[11px] text-slate">
                    per person{m.frequency === 'daily' ? ' / day' : ', ~every 3rd day'}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="rounded-xl bg-petrol-50 dark:bg-dark-border/40 p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate">Estimated meal total</div>
            <div className="font-mono-num mt-1 text-2xl font-semibold text-petrol-600 dark:text-petrol-100">
              {formatCurrency(mealBudget.totalTrip, trip.currency)}
            </div>
            <div className="mt-1 text-[12px] text-slate">
              {formatCurrencyPrecise(mealBudget.dailyPerPerson, trip.currency)} per person / day
            </div>
            <div className="mt-3 space-y-1.5 border-t border-petrol-100 dark:border-dark-border pt-3">
              {mealBudget.byLabel.map((b) => (
                <div key={b.label} className="flex justify-between text-[12px] text-ink-soft dark:text-paper-dim/80">
                  <span>{b.label}</span>
                  <span className="font-mono-num">{formatCurrency(b.amount, trip.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
