import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { BudgetPieChart, BudgetLegend } from '@/components/charts/BudgetPieChart';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { computeBudgetSummary, computeMealBudget, tripDurationDays, expenseTotal } from '@/lib/calculations';
import { formatCurrency, formatCurrencyPrecise, uid } from '@/lib/utils';
import { exportBudgetCSV } from '@/lib/exportImport';
import type { Expense, ExpenseCategory, PaymentStatus, RefundPolicy } from '@/types/trip';
import { Download, Plus, Trash2 } from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
  'flights', 'rail', 'bus', 'rental-car', 'fuel', 'parking', 'tolls',
  'accommodation', 'groceries', 'restaurants', 'coffee', 'alcohol',
  'activities', 'museum-tickets', 'shopping', 'laundry', 'pharmacy',
  'mobile-data', 'insurance', 'incidentals',
];
const STATUSES: PaymentStatus[] = ['paid', 'booked', 'reserved', 'estimated', 'optional', 'cancelled'];
const REFUNDS: RefundPolicy[] = ['refundable', 'non-refundable', 'partial'];

export default function Budget() {
  const trip = useTrip();
  const updateExpense = useTripStore((s) => s.updateExpense);
  const addExpense = useTripStore((s) => s.addExpense);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const updateMealAssumption = useTripStore((s) => s.updateMealAssumption);

  const summary = useMemo(() => computeBudgetSummary(trip), [trip]);
  const [mealDays, setMealDays] = useState(tripDurationDays(trip));
  const mealBudget = useMemo(() => computeMealBudget(trip, mealDays), [trip, mealDays]);

  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');

  const filteredExpenses = trip.expenses.filter((e) => filterStatus === 'all' || e.status === filterStatus);

  function handleAdd() {
    const exp: Expense = {
      id: uid('ex'),
      label: 'New expense',
      category: 'incidentals',
      amount: 0,
      status: 'estimated',
      refund: 'refundable',
    };
    addExpense(exp);
  }

  return (
    <AppShell title="Budget">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12px] text-ink-soft dark:text-paper-dim/80"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => exportBudgetCSV(trip)}
                className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-2.5 py-1 text-[12px] text-ink-soft dark:text-paper-dim/80 hover:bg-petrol-50 dark:hover:bg-dark-border"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-2.5 py-1 text-[12px] font-medium text-paper hover:bg-petrol-600"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </CardHeader>

          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-petrol-100 dark:border-dark-border text-[11px] uppercase tracking-wide text-slate">
                  <th className="py-2 pr-2 font-medium">Label</th>
                  <th className="py-2 pr-2 font-medium">Category</th>
                  <th className="py-2 pr-2 font-medium">Amount</th>
                  <th className="py-2 pr-2 font-medium">Status</th>
                  <th className="py-2 pr-2 font-medium">Refund</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-petrol-50 dark:border-dark-border/60 last:border-0">
                    <td className="py-1.5 pr-2">
                      <input
                        value={exp.label}
                        onChange={(e) => updateExpense(exp.id, { label: e.target.value })}
                        className="w-full min-w-[120px] rounded-md bg-transparent px-1.5 py-1 text-ink dark:text-paper-dim outline-none hover:bg-petrol-50 dark:hover:bg-dark-border focus:bg-petrol-50 dark:focus:bg-dark-border"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={exp.category}
                        onChange={(e) => updateExpense(exp.id, { category: e.target.value as ExpenseCategory })}
                        className="rounded-md bg-transparent px-1.5 py-1 text-ink-soft dark:text-paper-dim/80 outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) => updateExpense(exp.id, { amount: Number(e.target.value) })}
                        className="w-20 rounded-md bg-transparent px-1.5 py-1 font-mono-num text-ink dark:text-paper-dim outline-none hover:bg-petrol-50 dark:hover:bg-dark-border"
                      />
                      {exp.perTraveller && <span className="ml-1 text-[10px] text-slate">/pp</span>}
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={exp.status}
                        onChange={(e) => updateExpense(exp.id, { status: e.target.value as PaymentStatus })}
                        className="rounded-md bg-transparent outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={exp.refund}
                        onChange={(e) => updateExpense(exp.id, { refund: e.target.value as RefundPolicy })}
                        className="rounded-md bg-transparent text-[12px] outline-none"
                      >
                        {REFUNDS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={() => removeExpense(exp.id)}
                        className="rounded-md p-1 text-slate hover:bg-brick-400/10 hover:text-brick-500"
                        aria-label="Remove expense"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-petrol-100 dark:border-dark-border pt-3 text-[13px]">
            <span className="text-slate">{filteredExpenses.length} expenses shown</span>
            <span className="font-mono-num font-semibold text-ink dark:text-paper-dim">
              {formatCurrency(
                filteredExpenses.reduce((s, e) => (e.status !== 'cancelled' ? s + expenseTotal(e, trip.travellers.length) : s), 0),
                trip.currency
              )}
            </span>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>By category</CardTitle>
            </CardHeader>
            <BudgetPieChart data={summary.byGroup} currency={trip.currency} />
            <div className="mt-3">
              <BudgetLegend data={summary.byGroup} currency={trip.currency} />
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Meal budget</CardTitle>
          <span className="font-mono-num text-xs text-slate">{mealDays} days · {trip.travellers.length} travellers</span>
        </CardHeader>

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

      <div className="mt-4 flex flex-wrap gap-2">
        {[...new Set(trip.expenses.map((e) => e.status))].map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
      </div>
    </AppShell>
  );
}
