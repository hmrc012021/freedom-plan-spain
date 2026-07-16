import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScenarioBarChart } from '@/components/charts/ScenarioBarChart';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { recommendTransportScenario, scenarioTotal } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown, Clock, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Transport() {
  const trip = useTrip();
  const updateScenario = useTripStore((s) => s.updateScenario);

  const recommendation = useMemo(
    () => recommendTransportScenario(trip.transportScenarios, trip.travellers.length),
    [trip.transportScenarios, trip.travellers.length]
  );

  return (
    <AppShell title="Transport">
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
          return (
            <Card key={s.id} className={cn(isRecommended && 'border-petrol-400/50 ring-1 ring-petrol-400/20')}>
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{s.name}</CardTitle>
                    {isRecommended && (
                      <span className="rounded-full bg-petrol-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper">
                        Best value
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-slate">{s.description}</div>
                </div>
                <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
                  {formatCurrency(total, trip.currency)}
                </div>
              </CardHeader>

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
