import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, StatusSelect } from '@freedom-plan/ui';
import { ScenarioBarChart } from '@/components/charts/ScenarioBarChart';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { recommendTransportScenario, scenarioTotal } from '@/lib/calculations';
import { formatCurrency, uid } from '@/lib/utils';
import type { Expense, PaymentStatus } from '@/types/trip';
import { AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown, Clock, Gauge, Plane, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const AIRFARE_STATUSES: PaymentStatus[] = ['paid', 'booked', 'reserved', 'estimated', 'optional', 'cancelled'];

export default function Transport() {
  const trip = useTrip();
  const updateScenario = useTripStore((s) => s.updateScenario);
  const selectTransportScenario = useTripStore((s) => s.selectTransportScenario);
  const updateExpense = useTripStore((s) => s.updateExpense);
  const addExpense = useTripStore((s) => s.addExpense);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const [showAirfareForm, setShowAirfareForm] = useState(false);
  const [airfareLabel, setAirfareLabel] = useState('');
  const [airfareAmount, setAirfareAmount] = useState('');

  const airfare = trip.expenses.filter((e) => e.category === 'flights');
  const airfareTotal = airfare.reduce((sum, e) => (e.status !== 'cancelled' ? sum + e.amount : sum), 0);

  function handleAddAirfare() {
    if (!airfareLabel.trim()) return;
    const exp: Expense = {
      id: uid('ex'), label: airfareLabel.trim(), category: 'flights',
      amount: airfareAmount.trim() === '' ? 0 : Number(airfareAmount),
      status: 'estimated', refund: 'refundable',
    };
    addExpense(exp);
    setAirfareLabel(''); setAirfareAmount(''); setShowAirfareForm(false);
  }

  const recommendation = useMemo(
    () => recommendTransportScenario(trip.transportScenarios, trip.travellers.length),
    [trip.transportScenarios, trip.travellers.length]
  );
  const selectedScenario = trip.transportScenarios.find((s) => s.isSelected);

  return (
    <AppShell title="Transport">
      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane size={15} className="text-petrol-500" />
            <CardTitle>Airfare</CardTitle>
          </div>
          <span className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
            {formatCurrency(airfareTotal, trip.currency)}
          </span>
        </CardHeader>

        <div className="space-y-2">
          {airfare.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-petrol-50 dark:border-dark-border/60 px-3 py-2.5">
              <input
                value={e.label}
                onChange={(ev) => updateExpense(e.id, { label: ev.target.value })}
                className="min-w-[160px] flex-1 rounded-md bg-transparent px-1.5 py-1 text-[13px] text-ink dark:text-paper-dim outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
              />
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-mono-num text-[13px] text-ink dark:text-paper-dim">
                  <span className="text-slate text-[11px]">{trip.currency}</span>
                  <input
                    type="number"
                    value={e.amount}
                    onChange={(ev) => updateExpense(e.id, { amount: Number(ev.target.value) })}
                    className="w-24 rounded-md bg-transparent px-1.5 py-0.5 text-right outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
                  />
                </span>
                <StatusSelect value={e.status} options={AIRFARE_STATUSES} onChange={(v) => updateExpense(e.id, { status: v as PaymentStatus })} />
                <button onClick={() => removeExpense(e.id)} className="rounded-md p-1 text-slate hover:bg-brick-400/10 hover:text-brick-500" aria-label="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAirfareForm ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-petrol-100 dark:border-dark-border pt-3">
            <input
              value={airfareLabel}
              onChange={(e) => setAirfareLabel(e.target.value)}
              placeholder="e.g. Return flight to Faro"
              className="min-w-[180px] flex-1 rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
            />
            <input
              type="number"
              value={airfareAmount}
              onChange={(e) => setAirfareAmount(e.target.value)}
              placeholder="0.00"
              className="w-24 rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px]"
            />
            <button onClick={handleAddAirfare} disabled={!airfareLabel.trim()} className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-petrol-600 disabled:opacity-40">
              <Plus size={13} /> Add
            </button>
            <button onClick={() => setShowAirfareForm(false)} className="rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12.5px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAirfareForm(true)}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12.5px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
          >
            <Plus size={13} /> Add a flight
          </button>
        )}
      </Card>

      <Card className={cn('mb-5', selectedScenario ? 'border-petrol-400/30 bg-petrol-50/40 dark:bg-dark-surface' : 'border-brick-400/30 bg-brick-400/5')}>
        <CardHeader>
          <CardTitle>{selectedScenario ? `Working budget: ${selectedScenario.name}` : 'No scenario selected'}</CardTitle>
        </CardHeader>
        <p className="text-[13px] leading-relaxed text-ink-soft dark:text-paper-dim/80">
          {selectedScenario
            ? 'Only this scenario feeds the ground-transport budget. The cheapest option is still recommended below, but never selected automatically.'
            : 'Ground transport is excluded from the budget until you explicitly pick a scenario below — the recommendation alone doesn’t count.'}
        </p>
      </Card>

      <Card className="mb-5 border-petrol-400/30 bg-petrol-50/40 dark:bg-dark-surface">
        <CardHeader>
          <CardTitle>Recommendation</CardTitle>
          <CheckCircle2 size={16} className="text-petrol-500" />
        </CardHeader>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-ink-soft dark:text-paper-dim/80">
          {recommendation.reasoning.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
              {r}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Scenario comparison</CardTitle>
        </CardHeader>
        <ScenarioBarChart results={recommendation.results} currency={trip.currency} recommendedId={recommendation.recommendedId} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {trip.transportScenarios.map((s) => {
          const total = scenarioTotal(s);
          const isRecommended = s.id === recommendation.recommendedId;
          const isSelected = s.isSelected === true;
          return (
            <Card key={s.id} className={cn(isSelected ? 'border-petrol-400/60 ring-1 ring-petrol-400/30' : isRecommended && 'border-petrol-400/50 ring-1 ring-petrol-400/20')}>
              <CardHeader>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{s.name}</CardTitle>
                    {isSelected && (
                      <span className="rounded-full bg-petrol-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper">
                        In working budget
                      </span>
                    )}
                    {isRecommended && (
                      <span className="rounded-full border border-petrol-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-petrol-500">
                        Lowest modeled cost
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-slate">{s.description}</div>
                </div>
                <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
                  {formatCurrency(total, trip.currency)}
                </div>
              </CardHeader>

              {!isSelected && (
                <button
                  onClick={() => selectTransportScenario(s.id)}
                  className="mb-3 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-petrol-600"
                >
                  Use in working budget
                </button>
              )}

              {s.vehicleRequirement?.warning && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 px-3 py-2 text-[12px] text-amber-500">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {s.vehicleRequirement.warning}
                </div>
              )}

              {s.lineItems.length > 0 && (
                <div className="mb-3 space-y-1">
                  {s.lineItems.map((li, i) => (
                    <div key={i} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-ink-soft dark:text-paper-dim/80">{li.label}</span>
                      <span className="font-mono-num text-ink dark:text-paper-dim">
                        <input
                          type="number"
                          value={li.amount}
                          onChange={(e) => {
                            const newItems = [...s.lineItems];
                            newItems[i] = { ...li, amount: Number(e.target.value) };
                            updateScenario(s.id, { lineItems: newItems });
                          }}
                          className="w-20 rounded-md bg-transparent px-1 text-right outline-none hover:bg-petrol-50 dark:hover:bg-dark-border focus:bg-petrol-50 dark:focus:bg-dark-border"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-slate">
                {s.drivingTimeHrs != null && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {s.drivingTimeHrs}h driving
                  </span>
                )}
                {s.distanceKm != null && (
                  <span className="flex items-center gap-1">
                    <Gauge size={12} /> {s.distanceKm} km
                  </span>
                )}
                <span>Flexibility {s.flexibilityScore}/5</span>
                <span>Convenience {s.convenienceScore}/5</span>
              </div>

              {(s.pros.length > 0 || s.cons.length > 0) && (
                <div className="grid grid-cols-1 gap-3 border-t border-petrol-100 dark:border-dark-border pt-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-petrol-500">
                      <ThumbsUp size={12} /> Pros
                    </div>
                    <ul className="space-y-1 text-[12px] text-slate">
                      {s.pros.map((p, i) => <li key={i}>· {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brick-500">
                      <ThumbsDown size={12} /> Cons
                    </div>
                    <ul className="space-y-1 text-[12px] text-slate">
                      {s.cons.map((c, i) => <li key={i}>· {c}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
