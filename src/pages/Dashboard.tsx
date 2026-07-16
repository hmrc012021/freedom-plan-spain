import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, CloudSun, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BudgetPieChart, BudgetLegend } from '@/components/charts/BudgetPieChart';
import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { useTrip } from '@/store/useTripStore';
import {
  computeBudgetSummary,
  daysUntilDeparture,
  expectedDailySpend,
  bookingCompletionPct,
  tripProgressPct,
  nextAction,
} from '@/lib/calculations';
import { formatCurrency, formatDateFull } from '@/lib/utils';

export default function Dashboard() {
  const trip = useTrip();

  const summary = useMemo(() => computeBudgetSummary(trip), [trip]);
  const days = daysUntilDeparture(trip);
  const dailySpend = expectedDailySpend(trip);
  const completion = bookingCompletionPct(trip);
  const progress = tripProgressPct(trip);
  const action = nextAction(trip);

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total trip cost" value={formatCurrency(summary.totalTripCost, trip.currency)} tone="petrol" delay={0} />
        <StatCard label="Already paid" value={formatCurrency(summary.alreadyPaid, trip.currency)} tone="petrol" delay={0.03} />
        <StatCard label="Remaining" value={formatCurrency(summary.remaining, trip.currency)} tone="amber" delay={0.06} />
        <StatCard label="Daily spend" value={formatCurrency(dailySpend, trip.currency)} sublabel="expected / day" tone="petrol" delay={0.09} />
        <StatCard label="Per traveller" value={formatCurrency(summary.costPerTraveller, trip.currency)} tone="brick" delay={0.12} />
        <StatCard label="Departure" value={days >= 0 ? `T-${days}` : 'Underway'} sublabel={formatDateFull(trip.departureDate)} tone="petrol" delay={0.15} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget breakdown</CardTitle>
            <span className="font-mono-num text-xs text-slate">{summary.byGroup.length} categories</span>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BudgetPieChart data={summary.byGroup} currency={trip.currency} />
            <div className="flex flex-col justify-center">
              <BudgetLegend data={summary.byGroup} currency={trip.currency} />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Booking completion</CardTitle>
              <span className="font-mono-num text-sm text-petrol-500">{completion}%</span>
            </CardHeader>
            <ProgressBar value={completion} />
            <p className="mt-3 text-[13px] leading-relaxed text-slate">
              {trip.bookings.filter((b) => b.status === 'paid' || b.status === 'booked').length} of{' '}
              {trip.bookings.length} bookings are paid or confirmed.
            </p>
            <Link
              to="/bookings"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-petrol-500 hover:text-petrol-600"
            >
              View bookings <ArrowRight size={13} />
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip progress</CardTitle>
              <span className="font-mono-num text-sm text-petrol-500">{progress}%</span>
            </CardHeader>
            <ProgressBar value={progress} tone="amber" />
            <p className="mt-3 text-[13px] leading-relaxed text-slate">
              {formatDateFull(trip.departureDate)} → {formatDateFull(trip.returnDate)}
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily spend timeline</CardTitle>
          </CardHeader>
          <DailySpendChart trip={trip} />
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Next action</CardTitle>
            </CardHeader>
            {action ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="text-[13.5px] font-medium text-ink dark:text-paper-dim">{action.label}</div>
                  <div className="mt-0.5 text-[12.5px] text-slate">{action.detail}</div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-slate">Nothing urgent — every booking is on track.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Travellers</CardTitle>
              <Users size={15} className="text-slate" />
            </CardHeader>
            <div className="flex flex-wrap gap-1.5">
              {trip.travellers.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full border border-petrol-100 dark:border-dark-border px-2.5 py-1 text-[11.5px] text-ink-soft dark:text-paper-dim/80"
                >
                  {t.name} · {t.ageLabel}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weather</CardTitle>
              <CloudSun size={15} className="text-slate" />
            </CardHeader>
            <p className="text-[13px] text-slate">
              Forecasts open up closer to departure. Check back inside the last 10 days for Faro, Seville, Cordoba, Granada, and Valencia.
            </p>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent edits</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {trip.editLog.slice(0, 6).map((e) => (
            <div key={e.id} className="flex items-center justify-between text-[13px]">
              <span className="text-ink-soft dark:text-paper-dim/80">{e.summary}</span>
              <span className="font-mono-num text-[11px] text-slate">
                {new Date(e.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
