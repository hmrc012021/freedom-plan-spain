import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { ScenarioResult } from '@/lib/calculations';

export function ScenarioBarChart({
  results,
  currency,
  recommendedId,
}: {
  results: ScenarioResult[];
  currency: string;
  recommendedId: string | null;
}) {
  const data = results.map((r) => ({ name: r.scenario.name, total: r.total, id: r.scenario.id }));

  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-slate">Add scenario costs to compare.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#CFE4E4" />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v, currency)} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fontFamily: 'Inter' }} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={{ borderRadius: 12, border: '1px solid #CFE4E4', fontSize: 12, fontFamily: 'Inter' }}
        />
        <Bar dataKey="total" radius={[0, 6, 6, 0]}>
          {data.map((d) => (
            <Cell key={d.id} fill={d.id === recommendedId ? '#0F5257' : '#CFE4E4'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
