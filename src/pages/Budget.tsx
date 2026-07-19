import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, StatusSelect } from '@freedom-plan/ui';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { computeBudgetSummary, expenseTotal, type BudgetGroup } from '@/lib/calculations';
import { formatCurrency, uid } from '@/lib/utils';
import { exportBudgetCSV } from '@/lib/exportImport';
import type { Expense, ExpenseCategory, PaymentStatus } from '@/types/trip';
import { Route, BedDouble, UtensilsCrossed, Ticket, MoreHorizontal, Download, Plus, Trash2, ArrowRight } from 'lucide-react';

const OTHER_CATEGORIES: ExpenseCategory[] = ['shopping', 'laundry', 'pharmacy', 'mobile-data', 'insurance', 'incidentals'];
const STATUSES: PaymentStatus[] = ['paid', 'booked', 'reserved', 'estimated', 'optional', 'cancelled'];

const CATEGORY_META: Record<string, { icon: typeof Route; to?: string; color: string }> = {
  Transport: { icon: Route, to: '/transport', color: '#0F5257' },
  Accommodation: { icon: BedDouble, to: '/accommodation', color: '#A64E3B' },
  Meals: { icon: UtensilsCrossed, to: '/food', color: '#1D7A80' },
  Activities: { icon: Ticket, to: '/activities', color: '#CC8720' },
  Miscellaneous: { icon: MoreHorizontal, color: '#6B5B95' },
};

function CategoryBox({ group, currency }: { group: BudgetGroup; currency: string }) {
  const meta = CATEGORY_META[group.group];
  const Icon = meta.icon;
  const pct = group.amount > 0 ? Math.round((group.confirmedAmount / group.amount) * 100) : 0;

  const content = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-soft dark:text-paper-dim/80">
          <Icon size={14} style={{ color: meta.color }} /> {group.group}
        </span>
        {meta.to && <ArrowRight size={13} className="text-slate" />}
      </div>
      <div className="font-mono-num text-xl font-semibold text-ink dark:text-paper-dim">
        {formatCurrency(group.amount, currency)}
      </div>
      <div className="mt-1 text-[11px] text-slate">
        {formatCurrency(group.confirmedAmount, currency)} confirmed · {pct}%
        {group.isProvisional && ' · not yet booked'}
        {group.isDaily && ' · daily estimate'}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
      </div>
    </>
  );

  const className = 'block rounded-2xl border border-petrol-100 dark:border-dark-border bg-white/70 dark:bg-dark-surface p-4 shadow-sm shadow-petrol-900/5 transition-colors hover:border-petrol-400/40';

  return meta.to ? (
    <Link to={meta.to} className={className}>{content}</Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default function Budget() {
  const trip = useTrip();
  const updateExpense = useTripStore((s) => s.updateExpense);
  const addExpense = useTripStore((s) => s.addExpense);
  const removeExpense = useTripStore((s) => s.removeExpense);

  const summary = useMemo(() => computeBudgetSummary(trip), [trip]);
  const overallPct = summary.totalTripCost > 0 ? Math.round((summary.confirmedTripCost / summary.totalTripCost) * 100) : 0;

  const other = trip.expenses.filter((e) => OTHER_CATEGORIES.includes(e.category));

  function handleAdd() {
    const exp: Expense = { id: uid('ex'), label: 'New expense', category: 'incidentals', amount: 0, status: 'estimated', refund: 'refundable' };
    addExpense(exp);
  }

  return (
    <AppShell title="Budget">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-slate">
          {summary.byGroup.length} categories · tap one for the full picture
        </p>
        <span className="font-mono-num text-[13px] font-semibold text-petrol-500">{overallPct}% confirmed overall</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.byGroup.map((g) => (
          <CategoryBox key={g.group} group={g} currency={trip.currency} />
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Other</CardTitle>
          <div className="flex items-center gap-2">
            <button onClick={() => exportBudgetCSV(trip)} className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-2.5 py-1 text-[12px] text-ink-soft dark:text-paper-dim/80 hover:bg-petrol-50 dark:hover:bg-dark-border">
              <Download size={13} /> CSV
            </button>
            <button onClick={handleAdd} className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-2.5 py-1 text-[12px] font-medium text-paper hover:bg-petrol-600">
              <Plus size={13} /> Add
            </button>
          </div>
        </CardHeader>
        <p className="mb-3 text-[12.5px] text-slate">
          Things that don't fit accommodation, transport, food, or activities — shopping, insurance, a general reserve.
        </p>
        <div className="space-y-2">
          {other.map((exp) => (
            <div key={exp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-petrol-50 dark:border-dark-border/60 px-3 py-2.5">
              <input
                value={exp.label}
                onChange={(e) => updateExpense(exp.id, { label: e.target.value })}
                className="min-w-[140px] flex-1 rounded-md bg-transparent px-1.5 py-1 text-[13px] text-ink dark:text-paper-dim outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
              />
              <div className="flex items-center gap-2">
                <select
                  value={exp.category}
                  onChange={(e) => updateExpense(exp.id, { category: e.target.value as ExpenseCategory })}
                  className="rounded-md bg-transparent px-1.5 py-1 text-[12px] text-ink-soft dark:text-paper-dim/80 outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
                >
                  {OTHER_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                  ))}
                </select>
                <span className="flex items-center gap-1 font-mono-num text-[13px] text-ink dark:text-paper-dim">
                  <span className="text-slate text-[11px]">{trip.currency}</span>
                  <input
                    type="number"
                    value={exp.amount}
                    onChange={(e) => updateExpense(exp.id, { amount: Number(e.target.value) })}
                    className="w-24 rounded-md bg-transparent px-1.5 py-0.5 text-right outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
                  />
                </span>
                <StatusSelect value={exp.status} options={STATUSES} onChange={(v) => updateExpense(exp.id, { status: v as PaymentStatus })} />
                <button onClick={() => removeExpense(exp.id)} className="rounded-md p-1 text-slate hover:bg-brick-400/10 hover:text-brick-500" aria-label="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-petrol-100 dark:border-dark-border pt-3 text-[13px]">
          <span className="text-slate">{other.length} items shown</span>
          <span className="font-mono-num font-semibold text-ink dark:text-paper-dim">
            {formatCurrency(other.reduce((s, e) => (e.status !== 'cancelled' ? s + expenseTotal(e, trip.travellers.length) : s), 0), trip.currency)}
          </span>
        </div>
      </Card>
    </AppShell>
  );
}
