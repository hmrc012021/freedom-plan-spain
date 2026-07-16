import { formatCurrency } from '@/lib/utils';

const COLORS = ['#0F5257', '#E8A33D', '#A64E3B', '#1D7A80', '#CC8720', '#6B5B95'];

interface GroupDatum {
  group: string;
  amount: number;
  confirmedAmount: number;
  isDaily?: boolean;
  isProvisional?: boolean;
}

// Two bars per category: the full bar is estimated+confirmed, the bar below
// it is confirmed-only, both scaled against the largest category total so
// categories stay comparable to each other as well as to themselves.
export function BudgetBarChart({
  data,
  currency,
  notes,
}: {
  data: GroupDatum[];
  currency: string;
  notes?: (string | null)[];
}) {
  const filtered = data.filter((d) => d.amount > 0);

  if (filtered.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate">No expense data yet.</div>;
  }

  const max = Math.max(...filtered.map((d) => d.amount), 1);

  return (
    <div className="space-y-4">
      {filtered.map((d, i) => {
        const color = COLORS[i % COLORS.length];
        const totalPct = (d.amount / max) * 100;
        const confirmedPct = (d.confirmedAmount / max) * 100;
        return (
          <div key={d.group}>
            <div className="mb-1 flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-1.5 text-ink-soft dark:text-paper-dim/80">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {d.group}
                {d.isDaily && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    daily estimate
                  </span>
                )}
                {d.isProvisional && (
                  <span className="rounded-full bg-brick-400/10 px-1.5 py-0.5 text-[10px] font-medium text-brick-500">
                    not yet booked
                  </span>
                )}
              </span>
              <span className="font-mono-num text-ink dark:text-paper-dim">
                {formatCurrency(d.confirmedAmount, currency)}
                <span className="text-slate"> / {formatCurrency(d.amount, currency)}</span>
              </span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${totalPct}%`, backgroundColor: color, opacity: 0.3 }}
                />
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${confirmedPct}%`, backgroundColor: color }} />
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-1 text-[11px] text-slate">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-petrol-500 opacity-30" /> Estimated + confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-petrol-500" /> Confirmed only
        </span>
      </div>
      {notes?.filter((n): n is string => Boolean(n)).map((n, i) => (
        <p key={i} className="text-[11.5px] leading-relaxed text-slate">{n}</p>
      ))}
    </div>
  );
}
