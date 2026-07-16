import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#0F5257', '#E8A33D', '#A64E3B', '#1D7A80', '#CC8720'];

export function BudgetPieChart({ data, currency }: { data: { group: string; amount: number }[]; currency: string }) {
  const filtered = data.filter((d) => d.amount > 0);

  if (filtered.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-slate">No expense data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="amount"
          nameKey="group"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          stroke="none"
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatCurrency(Number(value), currency), name as string]}
          contentStyle={{ borderRadius: 12, border: '1px solid #CFE4E4', fontSize: 12, fontFamily: 'Inter' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BudgetLegend({ data, currency }: { data: { group: string; amount: number }[]; currency: string }) {
  const filtered = data.filter((d) => d.amount > 0);
  const total = filtered.reduce((s, d) => s + d.amount, 0) || 1;
  return (
    <div className="space-y-2">
      {filtered.map((d, i) => (
        <div key={d.group} className="flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-ink-soft dark:text-paper-dim/80">{d.group}</span>
          </div>
          <div className="flex items-center gap-2 font-mono-num text-ink dark:text-paper-dim">
            <span>{formatCurrency(d.amount, currency)}</span>
            <span className="text-slate w-10 text-right">{Math.round((d.amount / total) * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
